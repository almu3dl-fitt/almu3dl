import { supabaseAdmin } from '@/lib/supabase-admin'

const storageLegacyProductImageSlugs = new Set([
  'back-therapy',
  'beginner-workout-4days',
  'busy-program',
  'flexible-diet-1300',
  'flexible-diet-1500',
  'flexible-diet-1600',
  'flexible-diet-1800',
  'flexible-diet-2000',
  'football-2months',
  'gym-challenge',
  'healthy-recipes-book',
  'knee-therapy',
  'toning-program',
  'workout-cutter',
])

const localLegacyProductImages = new Map([
  ['nutrition-bundle', '/store-legacy-images/nutrition-bundle.svg'],
  ['rehab-bundle', '/store-legacy-images/rehab-bundle.svg'],
  ['workout-bundle', '/store-legacy-images/workout-bundle.svg'],
])

const PRODUCT_IMAGE_BUCKET = 'product-images'
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 30
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|avif|gif)$/i

export type ProductImageAsset = {
  path: string
  url: string
  fileName: string
  isLegacy: boolean
}

type ProductImageLookup = {
  id: string
  slug: string | null
}

function toAbsoluteStorageUrl(path: string) {
  if (path.startsWith('http')) {
    return path
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return baseUrl ? `${baseUrl}${path}` : path
}

function isImageFileName(fileName: string) {
  return IMAGE_FILE_PATTERN.test(fileName)
}

function buildProductImageStoragePath(productId: string, index: number, fileName: string) {
  const extensionMatch = fileName.match(/\.([^.]+)$/)
  const extension = extensionMatch?.[1]?.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'png'
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const safeBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const storageFileName = `${String(index + 1).padStart(3, '0')}-${safeBaseName || 'image'}-${crypto.randomUUID()}.${extension}`

  return `${productId}/${storageFileName}`
}

async function createSignedImage(path: string, options?: { isLegacy?: boolean }) {
  const { data, error } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS)

  if (error || !data?.signedUrl) {
    if (error) {
      console.error('Product image signed URL error:', error)
    }
    return null
  }

  return {
    path,
    url: toAbsoluteStorageUrl(data.signedUrl),
    fileName: path.split('/').pop() ?? path,
    isLegacy: options?.isLegacy ?? false,
  } satisfies ProductImageAsset
}

async function getFolderProductImages(productId: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .list(productId, {
      limit: 50,
      sortBy: { column: 'name', order: 'asc' },
    })

  if (error) {
    console.error('Product image list error:', error)
    return []
  }

  const imagePaths = (data ?? [])
    .map(item => item.name)
    .filter((fileName): fileName is string => Boolean(fileName) && isImageFileName(fileName))
    .map(fileName => `${productId}/${fileName}`)

  if (imagePaths.length === 0) {
    return []
  }

  const signedImages = await Promise.all(imagePaths.map(path => createSignedImage(path)))
  return signedImages.filter((image): image is ProductImageAsset => Boolean(image))
}

async function getLegacyProductImage(slug: string | null | undefined) {
  if (!slug) {
    return null
  }

  const localImageUrl = localLegacyProductImages.get(slug)

  if (localImageUrl) {
    return {
      path: localImageUrl,
      url: localImageUrl,
      fileName: localImageUrl.split('/').pop() ?? `${slug}.svg`,
      isLegacy: true,
    } satisfies ProductImageAsset
  }

  if (!storageLegacyProductImageSlugs.has(slug)) {
    return null
  }

  return createSignedImage(`${slug}.png`, { isLegacy: true })
}

export async function getProductImages(productId: string, slug: string | null | undefined) {
  const folderImages = await getFolderProductImages(productId)

  if (folderImages.length > 0) {
    return folderImages
  }

  const legacyImage = await getLegacyProductImage(slug)
  return legacyImage ? [legacyImage] : []
}

export async function getProductImageUrl(productId: string, slug: string | null | undefined) {
  const images = await getProductImages(productId, slug)
  return images[0]?.url ?? null
}

export async function getProductImageUrls(products: ProductImageLookup[]) {
  const imageUrlEntries = await Promise.all(
    products.map(async product => [product.id, await getProductImageUrl(product.id, product.slug)] as const),
  )

  return new Map(imageUrlEntries)
}

export async function getAdminProductImages(productId: string, slug: string | null | undefined) {
  return getProductImages(productId, slug)
}

export async function uploadProductImages(productId: string, files: File[]) {
  const { data: currentFiles, error: listError } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .list(productId, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    })

  if (listError) {
    throw new Error(`IMAGE_LOOKUP:${listError.message}`)
  }

  const startIndex = (currentFiles ?? []).filter(file => isImageFileName(file.name)).length
  const failures: { fileName: string; reason: string }[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const storagePath = buildProductImageStoragePath(productId, startIndex + index, file.name)
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      failures.push({
        fileName: file.name,
        reason: uploadError.message,
      })
    }
  }

  return failures
}

export async function deleteProductImage(
  productId: string,
  slug: string | null | undefined,
  imagePath: string,
) {
  const allowedLegacyPath = slug ? `${slug}.png` : null
  const allowedLocalLegacyPath = slug ? localLegacyProductImages.get(slug) ?? null : null

  if (
    !imagePath.startsWith(`${productId}/`) &&
    imagePath !== allowedLegacyPath &&
    imagePath !== allowedLocalLegacyPath
  ) {
    throw new Error('INVALID_IMAGE_PATH')
  }

  if (imagePath === allowedLocalLegacyPath) {
    throw new Error('READ_ONLY_LEGACY_IMAGE')
  }

  const { error } = await supabaseAdmin.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath])

  if (error) {
    throw new Error(error.message)
  }
}
