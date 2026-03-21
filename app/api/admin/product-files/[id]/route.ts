import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiSession } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PRODUCT_DOWNLOAD_BUCKET = 'products'

type ProductFileRelation = {
  id: string
  product_id: string
  storage_path: string | null
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorizedResponse = await requireAdminApiSession(req)

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  const { id } = await params

  const { data: file, error: fileLookupError } = await supabaseAdmin
    .from('product_files')
    .select('id, product_id, storage_path')
    .eq('id', id)
    .single()

  if (fileLookupError || !file) {
    console.error('Admin delete file lookup error:', fileLookupError)
    return NextResponse.json({ error: 'الملف غير موجود.' }, { status: 404 })
  }

  const fileRow = file as ProductFileRelation

  if (fileRow.storage_path) {
    const { error: storageDeleteError } = await supabaseAdmin.storage
      .from(PRODUCT_DOWNLOAD_BUCKET)
      .remove([fileRow.storage_path])

    if (storageDeleteError) {
      console.error('Admin delete file storage error:', storageDeleteError)
    }
  }

  const { error: deleteError } = await supabaseAdmin.from('product_files').delete().eq('id', id)

  if (deleteError) {
    console.error('Admin delete file row error:', deleteError)
    return NextResponse.json({ error: 'تعذر حذف الملف الآن.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, productId: fileRow.product_id })
}
