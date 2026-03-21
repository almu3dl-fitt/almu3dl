import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiSession } from '@/lib/admin-auth'
import { getAdminProductImages, uploadProductImages } from '@/lib/product-images'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PRODUCT_DOWNLOAD_BUCKET = 'products'

type AdminEditableProduct = {
  id: string
  title: string | null
  slug: string | null
  description: string | null
  price: number | null
  is_free: boolean | null
  level: string | null
  category_id: string | null
  is_active: boolean | null
  tags: string[] | null
}

type AdminProductFileRow = {
  id: string
  file_name: string
  storage_path: string
  sort_order: number | null
}

type ProductFileSortRow = {
  sort_order: number | null
}

type FileUploadFailure = {
  fileName: string
  reason: string
}

function buildProductSlug(rawSlug: string, title: string) {
  const baseValue = rawSlug.trim() || title.trim()

  return (
    baseValue
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || crypto.randomUUID()
  )
}

function parseBooleanValue(value: FormDataEntryValue | null) {
  return String(value || '') === 'true'
}

function parseTagsValue(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

function parseFiles(formData: FormData) {
  return formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0)
}

function parseImages(formData: FormData) {
  return formData
    .getAll('images')
    .filter(
      (value): value is File =>
        value instanceof File && value.size > 0 && value.type.startsWith('image/'),
    )
}

function buildDownloadStoragePath(productId: string, fileName: string) {
  const extensionMatch = fileName.match(/\.([^.]+)$/)
  const extension = extensionMatch?.[1]?.toLowerCase().replace(/[^a-z0-9]+/g, '') || ''
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const safeBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const storageFileName = `${safeBaseName || 'file'}-${crypto.randomUUID()}${extension ? `.${extension}` : ''}`

  return `${productId}/${storageFileName}`
}

async function uploadProductFiles(productId: string, files: File[]) {
  const { data: currentFiles, error: currentFilesError } = await supabaseAdmin
    .from('product_files')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (currentFilesError) {
    throw new Error(`FILE_LOOKUP:${currentFilesError.message}`)
  }

  const startSortOrder = Number(((currentFiles as ProductFileSortRow[] | null) ?? [])[0]?.sort_order ?? -1) + 1
  const failures: FileUploadFailure[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const storagePath = buildDownloadStoragePath(productId, file.name)
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PRODUCT_DOWNLOAD_BUCKET)
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      failures.push({
        fileName: file.name,
        reason: uploadError.message,
      })
      continue
    }

    const { error: insertError } = await supabaseAdmin.from('product_files').insert({
      product_id: productId,
      file_name: file.name,
      storage_path: storagePath,
      sort_order: startSortOrder + index,
    })

    if (insertError) {
      await supabaseAdmin.storage.from(PRODUCT_DOWNLOAD_BUCKET).remove([storagePath])
      failures.push({
        fileName: file.name,
        reason: insertError.message,
      })
    }
  }

  return failures
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorizedResponse = await requireAdminApiSession(req)

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  const { id } = await params

  const [{ data: product, error: productError }, { data: files, error: filesError }] =
    await Promise.all([
      supabaseAdmin.from('products').select('*').eq('id', id).single(),
      supabaseAdmin
        .from('product_files')
        .select('id, file_name, storage_path, sort_order')
        .eq('product_id', id)
        .order('sort_order'),
    ])

  if (productError || !product) {
    console.error('Admin product details error:', productError)
    return NextResponse.json({ error: 'تعذر تحميل بيانات المنتج.' }, { status: 404 })
  }

  if (filesError) {
    console.error('Admin product files error:', filesError)
    return NextResponse.json({ error: 'تعذر تحميل ملفات المنتج.' }, { status: 500 })
  }

  return NextResponse.json({
    product: product as AdminEditableProduct,
    files: (files as AdminProductFileRow[] | null) ?? [],
    images: await getAdminProductImages(id, (product as AdminEditableProduct).slug),
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorizedResponse = await requireAdminApiSession(req)

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  const { id } = await params

  try {
    const formData = await req.formData()
    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const rawSlug = String(formData.get('slug') || '')
    const level = String(formData.get('level') || 'beginner').trim() || 'beginner'
    const categoryId = String(formData.get('category_id') || '').trim()
    const isFree = parseBooleanValue(formData.get('is_free'))
    const isActive = parseBooleanValue(formData.get('is_active'))
    const tags = parseTagsValue(formData.get('tags'))
    const files = parseFiles(formData)
    const images = parseImages(formData)
    const priceValue = Number(formData.get('price') || 0)

    if (!title) {
      return NextResponse.json({ error: 'اسم المنتج مطلوب.' }, { status: 400 })
    }

    if (!isFree && (!Number.isFinite(priceValue) || priceValue < 0)) {
      return NextResponse.json({ error: 'أدخل سعرًا صحيحًا للمنتج.' }, { status: 400 })
    }

    const { data: currentProduct, error: currentProductError } = await supabaseAdmin
      .from('products')
      .select('slug')
      .eq('id', id)
      .single()

    if (currentProductError || !currentProduct) {
      console.error('Admin update product lookup error:', currentProductError)
      return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 })
    }

    const slug = buildProductSlug(rawSlug, title)

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        title,
        slug,
        description: description || null,
        price: isFree ? 0 : priceValue,
        is_free: isFree,
        level,
        category_id: categoryId || null,
        is_active: isActive,
        tags,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Admin update product error:', updateError)
      return NextResponse.json(
        { error: `تعذر حفظ التعديلات الآن.${updateError.message ? ` ${updateError.message}` : ''}` },
        { status: 500 },
      )
    }

    const uploadFailures = files.length > 0 ? await uploadProductFiles(id, files) : []
    const imageUploadFailures = images.length > 0 ? await uploadProductImages(id, images) : []

    if (uploadFailures.length > 0) {
      console.error('Admin update product partial upload failures:', uploadFailures)
    }

    if (imageUploadFailures.length > 0) {
      console.error('Admin update product partial image upload failures:', imageUploadFailures)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/products')
    revalidatePath('/store')
    revalidatePath(`/store/${currentProduct.slug}`)
    revalidatePath(`/store/${slug}`)

    const warningParts: string[] = []

    if (uploadFailures.length > 0) {
      warningParts.push(
        `تعذر رفع الملفات التالية: ${uploadFailures.map(file => file.fileName).join('، ')}`,
      )
    }

    if (imageUploadFailures.length > 0) {
      warningParts.push(
        `تعذر رفع الصور التالية: ${imageUploadFailures.map(file => file.fileName).join('، ')}`,
      )
    }

    return NextResponse.json({
      ok: true,
      slug,
      warning: warningParts.length > 0 ? `تم حفظ بيانات المنتج، لكن ${warningParts.join('، ')}.` : null,
    })
  } catch (error) {
    console.error('Admin update product route error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ التعديلات.' }, { status: 500 })
  }
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

  const [{ data: product, error: productError }, { data: files, error: filesError }] =
    await Promise.all([
      supabaseAdmin.from('products').select('slug').eq('id', id).single(),
      supabaseAdmin.from('product_files').select('storage_path').eq('product_id', id),
    ])

  if (productError || !product) {
    console.error('Admin delete product lookup error:', productError)
    return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 })
  }

  if (filesError) {
    console.error('Admin delete product files lookup error:', filesError)
    return NextResponse.json({ error: 'تعذر تحميل ملفات المنتج قبل الحذف.' }, { status: 500 })
  }

  const storagePaths = ((files as { storage_path: string | null }[] | null) ?? [])
    .map(file => file.storage_path)
    .filter((path): path is string => Boolean(path))

  if (storagePaths.length > 0) {
    const { error: storageDeleteError } = await supabaseAdmin.storage
      .from(PRODUCT_DOWNLOAD_BUCKET)
      .remove(storagePaths)

    if (storageDeleteError) {
      console.error('Admin delete product storage cleanup error:', storageDeleteError)
    }
  }

  const { error: filesDeleteError } = await supabaseAdmin
    .from('product_files')
    .delete()
    .eq('product_id', id)

  if (filesDeleteError) {
    console.error('Admin delete product file rows error:', filesDeleteError)
    return NextResponse.json({ error: 'تعذر حذف ملفات المنتج.' }, { status: 500 })
  }

  const { error: deleteError } = await supabaseAdmin.from('products').delete().eq('id', id)

  if (deleteError) {
    console.error('Admin delete product error:', deleteError)
    return NextResponse.json(
      { error: `تعذر حذف المنتج الآن.${deleteError.message ? ` ${deleteError.message}` : ''}` },
      { status: 500 },
    )
  }

  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath('/store')
  revalidatePath(`/store/${product.slug}`)

  return NextResponse.json({ ok: true })
}
