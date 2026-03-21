import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { sendOrderEmail } from '@/lib/email'
import { ensureCustomerAuthUser } from '@/lib/customer-auth'
import { randomUUID } from 'crypto'

type FreeOrderItem = {
  id: string
}

type FreeOrderBody = {
  email?: string
  full_name?: string
  phone?: string | null
  items?: FreeOrderItem[]
}

type InsertedOrderItem = {
  id: string
  product_id: string
}

type EmailDownloadRow = {
  token: string
  id: string
  order_item_id: string
  product_files: { file_name: string } | { file_name: string }[] | null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FreeOrderBody
    const { email, full_name, phone, items } = body

    if (!email || !full_name || !items?.length) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // 1. احفظ الإيميل
    await supabase.from('email_leads').upsert(
      { email, source: 'free_download' },
      { onConflict: 'email' }
    )

    // 2. أنشئ الطلب
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: email,
        customer_name: full_name,
        customer_phone: phone || null,
        amount: 0,
        status: 'paid',
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'خطأ في إنشاء الطلب' }, { status: 500 })
    }

    // 3. أضف المنتجات
    const orderItemRows = items.map((item: FreeOrderItem) => ({
      order_id: order.id,
      product_id: item.id,
      price_paid: 0,
    }))

    const { data: insertedItems } = await supabase
      .from('order_items')
      .insert(orderItemRows)
      .select()

    const safeInsertedItems = (insertedItems as InsertedOrderItem[] | null) ?? []

    // 4. إنشاء download لكل ملف
    if (safeInsertedItems.length > 0) {
      for (const item of safeInsertedItems) {
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
    }

    // 5. تجهيز حساب العميل في Auth بعد نجاح أول طلب
    try {
      await ensureCustomerAuthUser({
        email,
        fullName: full_name,
        phone,
      })
    } catch (authErr) {
      console.error('Customer auth ensure error (free order):', authErr)
    }

    // 6. إرسال الإيميل
    try {
      const itemIds = safeInsertedItems.map(item => item.id)

      const { data: allDownloads } = await supabase
        .from('downloads')
        .select('token, id, product_files(file_name), order_item_id')
        .in('order_item_id', itemIds)

      const baseUrl =
        (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '')

      const downloadLinks = ((allDownloads as EmailDownloadRow[] | null) || []).map(
        (download: EmailDownloadRow) => {
          const file = Array.isArray(download.product_files)
            ? download.product_files[0]
            : download.product_files

          return {
            title: file?.file_name?.replace(/\.pdf$/i, '') || 'ملف',
            url: `${baseUrl}/api/download/${download.token}?download=${download.id}`,
          }
        },
      )

      await sendOrderEmail({
        to: email,
        customerName: full_name,
        orderId: order.id,
        items: items.map(() => ({ title: '', price: 0 })),
        total: 0,
        downloadLinks,
      })
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ orderId: order.id })

  } catch (err) {
    console.error('Free order error:', err)
    return NextResponse.json({ error: 'حصل خطأ' }, { status: 500 })
  }
}
