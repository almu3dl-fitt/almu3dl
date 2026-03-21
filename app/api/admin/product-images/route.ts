import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiSession } from '@/lib/admin-auth'
import { deleteProductImage } from '@/lib/product-images'
import { supabaseAdmin } from '@/lib/supabase-admin'

type DeleteImageBody = {
  productId?: string
  imagePath?: string
}

export async function DELETE(req: NextRequest) {
  const unauthorizedResponse = await requireAdminApiSession(req)

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  let body: DeleteImageBody

  try {
    body = (await req.json()) as DeleteImageBody
  } catch {
    return NextResponse.json({ error: 'بيانات الطلب غير صحيحة.' }, { status: 400 })
  }

  const productId = String(body.productId || '').trim()
  const imagePath = String(body.imagePath || '').trim()

  if (!productId || !imagePath) {
    return NextResponse.json({ error: 'بيانات الصورة غير مكتملة.' }, { status: 400 })
  }

  const { data: product, error: productLookupError } = await supabaseAdmin
    .from('products')
    .select('id, slug')
    .eq('id', productId)
    .single()

  if (productLookupError || !product) {
    console.error('Admin product image delete lookup error:', productLookupError)
    return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 })
  }

  try {
    await deleteProductImage(product.id, product.slug, imagePath)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_IMAGE_DELETE_ERROR'
    console.error('Admin product image delete error:', message)

    return NextResponse.json(
      {
        error:
          message === 'INVALID_IMAGE_PATH'
            ? 'مسار الصورة غير صالح لهذا المنتج.'
            : 'تعذر حذف الصورة الآن.',
      },
      { status: 500 },
    )
  }

  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath('/store')
  revalidatePath(`/store/${product.slug}`)

  return NextResponse.json({ ok: true, productId: product.id })
}
