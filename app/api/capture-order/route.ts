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
  details?: Array<{
    issue?: string
    description?: string
  }>
  message?: string
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

type CaptureOrderBody = {
  orderId?: string
}

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

const routeErrorMessages = {
  missing_order: 'تعذر العثور على الطلب المطلوب لإكمال الدفع.',
  invalid_order: 'تعذر التحقق من الطلب الحالي. حاول إنشاء طلب جديد.',
  payment_failed: 'لم يكتمل الدفع بنجاح. يمكنك المحاولة مرة أخرى.',
  instrument_declined: 'تم رفض البطاقة أو وسيلة الدفع من PayPal. جرّب بطاقة أخرى أو أعد المحاولة.',
  unknown: 'حدث خطأ غير متوقع أثناء تأكيد الطلب. حاول مرة أخرى.',
} as const

type CaptureResult =
  | { ok: true; redirectTo: string }
  | { ok: false; errorCode: keyof typeof routeErrorMessages }

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

async function finalizePaidOrder(orderId: string | undefined, origin: string): Promise<CaptureResult> {
  if (!orderId) {
    return { ok: false, errorCode: 'missing_order' }
  }

  try {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order || !order.paypal_id) {
      return { ok: false, errorCode: 'invalid_order' }
    }

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

    if (!captureRes.ok || captureData.status !== 'COMPLETED') {
      const issue = captureData.details?.[0]?.issue
      console.error('PayPal capture error:', captureData)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return {
        ok: false,
        errorCode: issue === 'INSTRUMENT_DECLINED' ? 'instrument_declined' : 'payment_failed',
      }
    }

    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)

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

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, product_id')
      .eq('order_id', orderId)

    if (!orderItems || orderItems.length === 0) {
      return { ok: true, redirectTo: `/success?order=${orderId}` }
    }

    const safeOrderItems = (orderItems as OrderItem[] | null) ?? []
    const itemIds = safeOrderItems.map(item => item.id)
    await supabase.from('downloads').delete().in('order_item_id', itemIds)

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

    try {
      const { data: allDownloads } = await supabase
        .from('downloads')
        .select('id, token, product_files(file_name), order_item_id')
        .in('order_item_id', itemIds)

      const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '')
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

    return { ok: true, redirectTo: `/success?order=${orderId}` }
  } catch (err) {
    console.error('Capture order error:', err)
    return { ok: false, errorCode: 'unknown' }
  }
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId') || undefined
  const result = await finalizePaidOrder(orderId, req.nextUrl.origin)

  if (result.ok) {
    return NextResponse.redirect(new URL(result.redirectTo, req.url))
  }

  return NextResponse.redirect(new URL(`/checkout?error=${result.errorCode}`, req.url))
}

export async function POST(req: NextRequest) {
  let body: CaptureOrderBody = {}

  try {
    body = (await req.json()) as CaptureOrderBody
  } catch {
    body = {}
  }

  const result = await finalizePaidOrder(body.orderId, req.nextUrl.origin)

  if (result.ok) {
    return NextResponse.json({ redirectTo: result.redirectTo, success: true })
  }

  const status =
    result.errorCode === 'payment_failed'
      ? 402
      : result.errorCode === 'unknown'
        ? 500
        : 400

  return NextResponse.json(
    { code: result.errorCode, error: routeErrorMessages[result.errorCode] },
    { status }
  )
}
