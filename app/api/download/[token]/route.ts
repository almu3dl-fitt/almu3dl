import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

type OrderStatusRow = {
  orders: { status: string } | { status: string }[] | null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const downloadId = req.nextUrl.searchParams.get('download')

  // 1. جلب download row
  let query = supabase
    .from('downloads')
    .select('id, token, expires_at, download_count, max_downloads, product_file_id, order_item_id')
    .eq('token', token)

  if (downloadId) {
    query = query.eq('id', downloadId)
  }

  const { data: download, error } = await query.single()

  if (error || !download) {
    return NextResponse.json({ error: 'رابط غير صالح' }, { status: 404 })
  }

  // 2. جلب الملف مباشرة من product_file_id
  const { data: file } = await supabase
    .from('product_files')
    .select('file_name, storage_path')
    .eq('id', download.product_file_id)
    .single()

  if (!file || !file.storage_path) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
  }

  // 3. تحقق إن الطلب مدفوع
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('id, orders(status)')
    .eq('id', download.order_item_id)
    .single()

  const orderRelations = (orderItem as OrderStatusRow | null)?.orders
  const orderStatus = Array.isArray(orderRelations)
    ? orderRelations[0]?.status
    : orderRelations?.status

  if (orderStatus !== 'paid') {
    return NextResponse.json({ error: 'الطلب غير مدفوع' }, { status: 403 })
  }

  // 4. تحقق من الصلاحية (لو مفعّلة)
  if (download.expires_at && new Date(download.expires_at) < new Date()) {
    return NextResponse.json({ error: 'انتهت صلاحية الرابط' }, { status: 410 })
  }

  if (
    download.max_downloads !== null &&
    download.max_downloads !== undefined &&
    (download.download_count || 0) >= download.max_downloads
  ) {
    return NextResponse.json({ error: 'تم تجاوز الحد الأقصى للتحميلات' }, { status: 429 })
  }

  // 5. إنشاء signed URL
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('products')
    .createSignedUrl(file.storage_path, 3600)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error('Signed URL error:', signedUrlError)
    return NextResponse.json({ error: 'خطأ في إنشاء رابط التحميل' }, { status: 500 })
  }

  // 6. تحديث عداد التحميلات
  await supabase
    .from('downloads')
    .update({ download_count: (download.download_count || 0) + 1 })
    .eq('id', download.id)

  // 7. توجيه للملف
  return NextResponse.redirect(signedUrlData.signedUrl)
}
