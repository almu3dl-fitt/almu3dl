import { supabaseAdmin } from '@/lib/supabase-admin'

type ApprovedReviewRow = {
  id: string
  rating: number
  comment: string | null
  customer_name: string | null
  customer_email: string
  created_at: string
}

export type ProductReview = {
  id: string
  rating: number
  comment: string
  customerName: string
  createdAt: string
}

export type ProductReviewSummary = {
  averageRating: number
  reviewsCount: number
  reviews: ProductReview[]
}

export type ProductReviewAccess = {
  orderId: string
  initialReview: {
    id: string
    rating: number
    comment: string
    status: string
  } | null
}

type ReviewPurchaseRow = {
  order_id: string
}

type ExistingReviewRow = {
  id: string
  rating: number
  comment: string | null
  status: string
}

function getFallbackName(email: string) {
  const prefix = email.split('@')[0]?.trim()
  return prefix ? prefix.replace(/[._-]+/g, ' ') : 'عميل موثق'
}

export async function getApprovedProductReviews(
  productId: string,
): Promise<ProductReviewSummary> {
  const { data, error } = await supabaseAdmin
    .from('product_reviews')
    .select('id, rating, comment, customer_name, customer_email, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code !== 'PGRST205') {
      console.error('Approved product reviews error:', error)
    }

    return {
      averageRating: 0,
      reviewsCount: 0,
      reviews: [],
    }
  }

  const safeRows = (data as ApprovedReviewRow[] | null) ?? []
  const reviews = safeRows.map(review => ({
    id: review.id,
    rating: Number(review.rating || 0),
    comment: review.comment?.trim() || '',
    customerName: review.customer_name?.trim() || getFallbackName(review.customer_email),
    createdAt: review.created_at,
  }))

  const reviewsCount = reviews.length
  const averageRating = reviewsCount
    ? Number(
        (reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount).toFixed(1),
      )
    : 0

  return {
    averageRating,
    reviewsCount,
    reviews,
  }
}

export async function getProductReviewAccess(productId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!productId.trim() || !normalizedEmail) {
    return null
  }

  const { data: purchases, error: purchaseError } = await supabaseAdmin
    .from('order_items')
    .select(`
      order_id,
      orders!inner ( customer_email, status )
    `)
    .eq('product_id', productId)
    .ilike('orders.customer_email', normalizedEmail)
    .eq('orders.status', 'paid')
    .limit(1)

  if (purchaseError) {
    console.error('Product review access purchase error:', purchaseError)
    return null
  }

  const purchase = ((purchases as ReviewPurchaseRow[] | null) ?? [])[0]

  if (!purchase?.order_id) {
    return null
  }

  const { data: existingReview, error: existingReviewError } = await supabaseAdmin
    .from('product_reviews')
    .select('id, rating, comment, status')
    .eq('product_id', productId)
    .ilike('customer_email', normalizedEmail)
    .maybeSingle()

  if (existingReviewError && existingReviewError.code !== 'PGRST205') {
    console.error('Product review access lookup error:', existingReviewError)
    return null
  }

  const review = (existingReview as ExistingReviewRow | null) ?? null

  return {
    orderId: purchase.order_id,
    initialReview: review
      ? {
          id: review.id,
          rating: Number(review.rating || 0),
          comment: review.comment?.trim() || '',
          status: review.status,
        }
      : null,
  } satisfies ProductReviewAccess
}
