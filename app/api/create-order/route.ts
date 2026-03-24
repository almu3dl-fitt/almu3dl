import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

type CreateOrderItem = {
  id: string
  price: number
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

    // 2. أنشئ الطلب في DB بحالة pending
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: email,
        customer_name: full_name,
        customer_phone: phone || null,
        amount: total,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'خطأ في إنشاء الطلب' }, { status: 500 })
    }

    // 3. أضف المنتجات للطلب
    const orderItems = items.map((item: CreateOrderItem) => ({
      order_id: order.id,
      product_id: item.id,
      price_paid: item.price,
    }))

    await supabase.from('order_items').insert(orderItems)

    // 4. أنشئ طلب PayPal
    const token = await getPayPalToken()

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
            currency_code: 'USD',
            value: total.toFixed(2),
          },
          description: `طلب من المعضل - ${items.length} منتج`,
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'المعضل - Almu3dl',
              return_url: `${req.nextUrl.origin}/api/capture-order?orderId=${order.id}`,
              cancel_url: `${req.nextUrl.origin}/checkout?cancelled=true`,
              user_action: 'PAY_NOW',
              landing_page: 'GUEST_CHECKOUT',
            },
          },
        },
      }),
    })

    const paypalData = (await paypalRes.json()) as PayPalOrderResponse

    if (!paypalRes.ok) {
      return NextResponse.json({ error: 'خطأ في PayPal' }, { status: 500 })
    }

    // 5. احفظ PayPal ID في الطلب
    await supabase
      .from('orders')
      .update({ paypal_id: paypalData.id })
      .eq('id', order.id)

    // 6. ارجع رابط الدفع
    const approvalUrl = paypalData.links.find((link: PayPalLink) => link.rel === 'approve')?.href

    return NextResponse.json({ approvalUrl, orderId: order.id })

  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'حصل خطأ' }, { status: 500 })
  }
}
