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
