import { NextRequest, NextResponse } from 'next/server'
import { convertSarToPayPalAmount, PAYPAL_CURRENCY_CODE } from '@/lib/paypal-currency'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

type CreateOrderItem = {
  id: string
}

type CreateOrderBody = {
  email?: string
  full_name?: string
  phone?: string | null
  items?: CreateOrderItem[]
  total?: number
}

type PayPalAuthResponse = {
  access_token: string
}

type PayPalLink = {
  rel: string
  href: string
}

type PayPalOrderResponse = {
  id: string
  links: PayPalLink[]
}

type ProductRow = {
  id: string
  price: number | null
  is_free: boolean | null
}

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalToken() {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
      ).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = (await res.json()) as PayPalAuthResponse
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateOrderBody
    const { email, full_name, phone, items, total } = body

    if (!email || !full_name || !items?.length || typeof total !== 'number') {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // 1. احفظ الإيميل في email_leads
    await supabase.from('email_leads').upsert(
      { email, source: 'checkout' },
      { onConflict: 'email' }
    )

    const itemIds = items.map(item => item.id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, is_free')
      .in('id', itemIds)

    if (productsError || !products) {
      return NextResponse.json({ error: 'تعذر التحقق من المنتجات الحالية' }, { status: 500 })
    }

    if (products.length !== itemIds.length) {
      return NextResponse.json({ error: 'بعض المنتجات لم تعد متاحة للطلب' }, { status: 400 })
    }

    const productsById = new Map(
      (products as ProductRow[]).map(product => [product.id, product])
    )

    const verifiedOrderItems = items.map(item => {
      const product = productsById.get(item.id)

      if (!product) {
        throw new Error(`Missing product during checkout: ${item.id}`)
      }

      return {
        product_id: item.id,
        price_paid: product.is_free ? 0 : Number(product.price ?? 0),
      }
    })

    const verifiedTotal = verifiedOrderItems.reduce((sum, item) => sum + item.price_paid, 0)

    // 2. أنشئ الطلب في DB بحالة pending
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: email,
        customer_name: full_name,
        customer_phone: phone || null,
        amount: verifiedTotal,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'خطأ في إنشاء الطلب' }, { status: 500 })
    }

    // 3. أضف المنتجات للطلب
    const orderItems = verifiedOrderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      price_paid: item.price_paid,
    }))

    await supabase.from('order_items').insert(orderItems)

    // 4. أنشئ طلب PayPal
    const token = await getPayPalToken()
    const paypalAmount = convertSarToPayPalAmount(verifiedTotal)

    const paypalRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: order.id,
          amount: {
            currency_code: PAYPAL_CURRENCY_CODE,
            value: paypalAmount.toFixed(2),
          },
          description: `طلب من المعضل - ${items.length} منتج`,
        }],
        application_context: {
          brand_name: 'المعضل - Almu3dl',
          return_url: `${req.nextUrl.origin}/api/capture-order?orderId=${order.id}`,
          cancel_url: `${req.nextUrl.origin}/checkout?cancelled=true`,
          user_action: 'PAY_NOW',
          landing_page: 'BILLING',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    })

    const paypalData = (await paypalRes.json()) as PayPalOrderResponse

    if (!paypalRes.ok) {
      console.error('PayPal create order error:', paypalData)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
      return NextResponse.json({ error: 'خطأ في PayPal' }, { status: 500 })
    }

    // 5. احفظ PayPal ID في الطلب
    await supabase
      .from('orders')
      .update({ paypal_id: paypalData.id })
      .eq('id', order.id)

    // 6. ارجع رابط الدفع
    const approvalUrl = paypalData.links.find((link: PayPalLink) => link.rel === 'approve')?.href

    return NextResponse.json({ approvalUrl, orderId: order.id, paypalOrderId: paypalData.id })

  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'حصل خطأ' }, { status: 500 })
  }
}
