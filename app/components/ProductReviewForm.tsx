'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type InitialReview = {
  id: string
  rating: number
  comment: string
  status: string
} | null

export default function ProductReviewForm({
  orderId,
  productId,
  productTitle,
  initialReview,
}: {
  orderId: string
  productId: string
  productTitle: string
  initialReview: InitialReview
}) {
  const router = useRouter()
  const [rating, setRating] = useState(initialReview?.rating ?? 5)
  const [comment, setComment] = useState(initialReview?.comment ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (rating < 1 || rating > 5) {
      setError('اختر تقييمًا من 1 إلى 5 نجوم.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          productId,
          rating,
          comment: comment.trim(),
        }),
      })

      const data = (await response.json()) as { error?: string; message?: string }

      if (!response.ok) {
        setError(data.error || 'تعذر حفظ التقييم الآن. حاول مرة أخرى.')
        setLoading(false)
        return
      }

      setSuccess(data.message || 'تم حفظ تقييمك بنجاح.')
      router.refresh()
    } catch {
      setError('تعذر حفظ التقييم الآن. حاول مرة أخرى.')
    }

    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: '0.75rem',
        padding: '0.95rem',
        borderRadius: '18px',
        border: '1px solid rgba(17, 17, 17, 0.08)',
        background: '#fff',
      }}
    >
      <div>
        <strong style={{ fontSize: '0.95rem', color: '#1a1a1a' }}>
          قيّم {productTitle}
        </strong>
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`اختيار ${star} نجوم`}
            style={{
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '12px',
              border: star <= rating ? '1px solid #f0ddb0' : '1px solid #ececec',
              background: star <= rating ? '#fff8e7' : '#fff',
              color: star <= rating ? '#b8912e' : '#b4b4b4',
              fontSize: '1.15rem',
              cursor: 'pointer',
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={event => setComment(event.target.value)}
        placeholder="اكتب تجربتك مع هذا المنتج بشكل يساعد العملاء الآخرين."
        rows={4}
        style={{
          width: '100%',
          resize: 'vertical',
          padding: '0.85rem 0.95rem',
          borderRadius: '14px',
          border: '1px solid #ddd',
          fontFamily: "'Tajawal', Arial, sans-serif",
          fontSize: '0.92rem',
          direction: 'rtl',
          outline: 'none',
          background: '#fff',
        }}
      />

      {error && (
        <div
          style={{
            padding: '0.75rem 0.85rem',
            borderRadius: '14px',
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '0.75rem 0.85rem',
            borderRadius: '14px',
            border: '1px solid #bbf7d0',
            background: '#f0fdf4',
            color: '#15803d',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          minHeight: '48px',
          border: 'none',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #d4a843, #b8912e)',
          color: '#fff',
          fontWeight: 900,
          fontSize: '0.92rem',
          fontFamily: "'Tajawal', Arial, sans-serif",
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading
          ? 'جار حفظ التقييم...'
          : initialReview
            ? 'تحديث التقييم'
            : 'إرسال التقييم'}
      </button>
    </form>
  )
}
