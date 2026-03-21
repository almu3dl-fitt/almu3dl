import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiSession } from '@/lib/admin-auth'
import { uploadProductImages } from '@/lib/product-images'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PRODUCT_DOWNLOAD_BUCKET = 'products'

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

async function uploadProductFiles(productId: string, files: File[], startSortOrder = 0) {
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
      throw new Error(`UPLOAD:${uploadError.message}`)
    }

    const { error: insertError } = await supabaseAdmin.from('product_files').insert({
      product_id: productId,
      file_name: file.name,
      storage_path: storagePath,
      sort_order: startSortOrder + index,
    })

    if (insertError) {
      throw new Error(`FILE_RECORD:${insertError.message}`)
    }
  }
}

export async function POST(req: NextRequest) {
  const unauthorizedResponse = await requireAdminApiSession(req)

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

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

    const slug = buildProductSlug(rawSlug, title)

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        title,
        description: description || null,
        price: isFree ? 0 : priceValue,
        is_free: isFree,
        level,
        slug,
        category_id: categoryId || null,
        is_active: isActive,
        tags,
      })
      .select('id, slug')
      .single()

    if (productError || !product) {
      console.error('Admin create product error:', productError)
      return NextResponse.json(
        { error: `تعذر حفظ المنتج الآن.${productError?.message ? ` ${productError.message}` : ''}` },
        { status: 500 },
      )
    }

    try {
      if (files.length > 0) {
        await uploadProductFiles(product.id, files)
      }
    } catch (error) {
      console.error('Admin create product file upload error:', error)

      await supabaseAdmin.from('product_files').delete().eq('product_id', product.id)
      await supabaseAdmin.from('products').delete().eq('id', product.id)

      return NextResponse.json(
        { error: 'تم إنشاء المنتج لكن فشل رفع الملفات. أعد المحاولة.' },
        { status: 500 },
      )
    }

    const imageUploadFailures = images.length > 0 ? await uploadProductImages(product.id, images) : []

    if (imageUploadFailures.length > 0) {
      console.error('Admin create product partial image upload failures:', imageUploadFailures)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/products')
    revalidatePath('/store')
    revalidatePath(`/store/${product.slug}`)

    return NextResponse.json({
      id: product.id,
      slug: product.slug,
      warning:
        imageUploadFailures.length > 0
          ? `تم إنشاء المنتج، لكن تعذر رفع الصور التالية: ${imageUploadFailures
              .map(file => file.fileName)
              .join('، ')}.`
          : null,
    })
  } catch (error) {
    console.error('Admin create product route error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء المنتج.' }, { status: 500 })
  }
}
