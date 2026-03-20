'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'

type ReviewRelationRow = {
  product_id: string
  products: { slug: string | null } | { slug: string | null }[] | null
}

function normalizeRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

async function revalidateReviewPaths(reviewId: string) {
  const { data } = await supabaseAdmin
    .from('product_reviews')
    .select('product_id, products(slug)')
    .eq('id', reviewId)
    .maybeSingle()

  const review = (data as ReviewRelationRow | null) ?? null
  return normalizeRelation(review?.products ?? null)?.slug || null
}

function revalidateAllReviewViews(productSlug: string | null) {
  revalidatePath('/admin')
  revalidatePath('/admin/reviews')

  if (productSlug) {
    revalidatePath(`/store/${productSlug}`)
  }
}

export async function updateReviewStatusAction(formData: FormData) {
  const reviewId = String(formData.get('reviewId') || '')
  const status = String(formData.get('status') || '')

  if (!reviewId || !['approved', 'hidden'].includes(status)) {
    return
  }

  const productSlug = await revalidateReviewPaths(reviewId)

  await supabaseAdmin
    .from('product_reviews')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)

  revalidateAllReviewViews(productSlug)
}

export async function deleteReviewAction(formData: FormData) {
  const reviewId = String(formData.get('reviewId') || '')

  if (!reviewId) {
    return
  }

  const productSlug = await revalidateReviewPaths(reviewId)
  await supabaseAdmin.from('product_reviews').delete().eq('id', reviewId)
  revalidateAllReviewViews(productSlug)
}
