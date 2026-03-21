import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { sendOrderEmail } from '@/lib/email'
import { ensureCustomerAuthUser } from '@/lib/customer-auth'
import { randomUUID } from 'crypto'

type PayPalAuthResponse = {
  access_token: string
}

type PayPalCaptureResponse = {
  status: string
}

type OrderItem = {
  id: string
  product_id: string
}

type EmailDownloadRow = {
  id: string
  token: string
  order_item_id: string
  product_files: { file_name: string } | { file_name: string }[] | null
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.redirect(new URL('/checkout?error=missing_order', req.url))
    }

    // 1. جلب الطلب
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order || !order.paypal_id) {
      return NextResponse.redirect(new URL('/checkout?error=invalid_order', req.url))
    }

    // 2. Capture الدفع
    const token = await getPayPalToken()
    const captureRes = await fetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${order.paypal_id}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const captureData = (await captureRes.json()) as PayPalCaptureResponse

    if (captureData.status !== 'COMPLETED') {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.redirect(new URL('/checkout?error=payment_failed', req.url))
    }

    // 3. حدّث حالة الطلب
    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)

    // 4. تجهيز حساب العميل في Auth بعد نجاح الدفع
    try {
      if (order.customer_email) {
        await ensureCustomerAuthUser({
          email: order.customer_email,
          fullName: order.customer_name,
          phone: order.customer_phone,
        })
      }
    } catch (authErr) {
      console.error('Customer auth ensure error (capture order):', authErr)
    }

    // 5. جلب order_items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, product_id')
      .eq('order_id', orderId)

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.redirect(new URL(`/success?order=${orderId}`, req.url))
    }

    // 6. حذف downloads قديمة
    const safeOrderItems = (orderItems as OrderItem[] | null) ?? []
    const itemIds = safeOrderItems.map(item => item.id)
    await supabase.from('downloads').delete().in('order_item_id', itemIds)

    // 7. إنشاء download لكل ملف
    for (const item of safeOrderItems) {
      const { data: files } = await supabase
        .from('product_files')
        .select('id, file_name, storage_path')
        .eq('product_id', item.product_id)
        .order('sort_order')

      if (files && files.length > 0) {
        const downloadRows = files.map(file => ({
          order_item_id: item.id,
          product_file_id: file.id,
          token: randomUUID(),
          expires_at: null,
          download_count: 0,
          max_downloads: null,
        }))
        await supabase.from('downloads').insert(downloadRows)
      }
    }

    // 8. إرسال الإيميل
    try {
      const { data: allDownloads } = await supabase
        .from('downloads')
        .select('id, token, product_files(file_name), order_item_id')
        .in('order_item_id', itemIds)

      const baseUrl =
        (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '')

      const safeDownloads = (allDownloads as EmailDownloadRow[] | null) ?? []

      const downloadLinks = safeDownloads.map((download: EmailDownloadRow) => {
        const file = Array.isArray(download.product_files)
          ? download.product_files[0]
          : download.product_files

        return {
          title: file?.file_name?.replace(/\.pdf$/i, '') || 'ملف',
          url: `${baseUrl}/api/download/${download.token}?download=${download.id}`,
        }
      })

      const emailItems = safeOrderItems.map(item => {
        const matchingDownloads = safeDownloads.filter(download => download.order_item_id === item.id)
        return { title: `${matchingDownloads.length} ملف`, price: 0 }
      })

      if (order.customer_email) {
        await sendOrderEmail({
          to: order.customer_email,
          customerName: order.customer_name || '',
          orderId,
          items: emailItems,
          total: order.amount,
          downloadLinks,
        })
      }
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    // 9. وجّه لصفحة النجاح
    return NextResponse.redirect(new URL(`/success?order=${orderId}`, req.url))

  } catch (err) {
    console.error('Capture order error:', err)
    return NextResponse.redirect(new URL('/checkout?error=unknown', req.url))
  }
}
