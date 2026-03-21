import { supabaseAdmin } from '@/lib/supabase-admin'

const productImageSlugs = new Set([
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

const PRODUCT_IMAGE_BUCKET = 'product-images'
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 30

function toAbsoluteStorageUrl(path: string) {
  if (path.startsWith('http')) {
    return path
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return baseUrl ? `${baseUrl}${path}` : path
}

export async function getProductImageUrl(slug: string | null | undefined) {
  if (!slug || !productImageSlugs.has(slug)) {
    return null
  }

  const { data, error } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .createSignedUrl(`${slug}.png`, SIGNED_URL_EXPIRY_SECONDS)

  if (error) {
    console.error('Product image signed URL error:', error)
    return null
  }

  return data?.signedUrl ? toAbsoluteStorageUrl(data.signedUrl) : null
}

export async function getProductImageUrls(slugs: string[]) {
  const imageUrlEntries = await Promise.all(
    [...new Set(slugs)]
      .filter(slug => productImageSlugs.has(slug))
      .map(async slug => [slug, await getProductImageUrl(slug)] as const),
  )

  return new Map(imageUrlEntries)
}
