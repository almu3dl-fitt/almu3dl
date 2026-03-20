import Link from 'next/link'
import { deleteReviewAction, updateReviewStatusAction } from '@/app/admin/reviews/actions'
import { supabaseAdmin } from '@/lib/supabase-admin'

type AdminReviewRow = {
  id: string
  rating: number
  comment: string | null
  status: string
  created_at: string
  customer_name: string | null
  customer_email: string
  products: { title: string; slug: string | null } | { title: string; slug: string | null }[] | null
  orders: { id: string } | { id: string }[] | null
}

function normalizeRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

const statusTheme: Record<string, { label: string; background: string; color: string }> = {
  approved: { label: 'معتمد', background: '#ecfdf3', color: '#15803d' },
  pending: { label: 'بانتظار المراجعة', background: '#fff8e7', color: '#8f6a14' },
  hidden: { label: 'مخفي', background: '#f3f4f6', color: '#4b5563' },
}

export default async function AdminReviewsPage() {
  const { data, error } = await supabaseAdmin
    .from('product_reviews')
    .select(`
      id,
      rating,
      comment,
      status,
      created_at,
      customer_name,
      customer_email,
      products ( title, slug ),
      orders ( id )
    `)
    .order('created_at', { ascending: false })

  if (error && error.code !== 'PGRST205') {
    console.error('Admin reviews page error:', error)
  }

  const reviews = ((data as AdminReviewRow[] | null) ?? []).map(review => ({
    ...review,
    product: normalizeRelation(review.products),
    order: normalizeRelation(review.orders),
  }))

  const pendingCount = reviews.filter(review => review.status === 'pending').length
  const approvedCount = reviews.filter(review => review.status === 'approved').length

  return (
    <div style={{ padding: '2rem', fontFamily: "'Tajawal', Arial", direction: 'rtl' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.3rem' }}>التقييمات</h1>
          <p style={{ color: '#888', margin: 0 }}>مراجعة واعتماد تقييمات المشترين وربطها بالمنتجات والطلبات.</p>
        </div>
        <Link href="/admin" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>← لوحة الإدارة</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#fef9ee', border: '1px solid #fde68a', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#B8912E', margin: 0 }}>{pendingCount}</p>
          <p style={{ fontSize: '0.82rem', color: '#777', margin: '0.35rem 0 0' }}>بانتظار المراجعة</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', margin: 0 }}>{approvedCount}</p>
          <p style={{ fontSize: '0.82rem', color: '#777', margin: '0.35rem 0 0' }}>معتمد</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#555', margin: 0 }}>{reviews.length}</p>
          <p style={{ fontSize: '0.82rem', color: '#777', margin: '0.35rem 0 0' }}>إجمالي التقييمات</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div style={{ padding: '1.25rem', border: '1px dashed #ddd', borderRadius: '16px', background: '#fff', color: '#888', textAlign: 'center', lineHeight: 1.8 }}>
          لا توجد تقييمات بعد. إذا كانت الميزة مفعلة في الواجهة ولم تظهر هنا، فتأكد من
          تطبيق migration الخاصة بجدول <code>product_reviews</code>.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {reviews.map(review => {
            const status = statusTheme[review.status] || statusTheme.pending

            return (
              <article key={review.id} style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                  <div>
                    <p style={{ fontWeight: 900, fontSize: '1rem', margin: '0 0 0.2rem' }}>
                      {review.product?.title || 'منتج محذوف'}
                    </p>
                    <p style={{ fontSize: '0.84rem', color: '#777', margin: 0 }}>
                      {review.customer_name || review.customer_email}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#9a9a9a', margin: '0.25rem 0 0' }}>
                      {review.customer_email}
                    </p>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0.8rem', borderRadius: '999px', background: status.background, color: status.color, fontSize: '0.78rem', fontWeight: 900 }}>
                      {status.label}
                    </span>
                    <p style={{ fontSize: '0.76rem', color: '#999', margin: '0.45rem 0 0' }}>
                      {new Intl.DateTimeFormat('ar-SA', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(review.created_at))}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                  <div style={{ color: '#B8912E', fontSize: '1.05rem', fontWeight: 900 }}>
                    {'★'.repeat(review.rating).padEnd(5, '☆')}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.78rem' }}>
                    {review.order?.id ? `الطلب #${review.order.id.slice(0, 8)}` : 'بدون طلب ظاهر'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem 0.95rem', borderRadius: '14px', backgroundColor: '#fafafa', color: '#555', lineHeight: 1.9, fontSize: '0.88rem', marginBottom: '0.85rem' }}>
                  {review.comment?.trim() || 'بدون تعليق نصي.'}
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <form action={updateReviewStatusAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" style={{ minHeight: '40px', padding: '0.62rem 0.95rem', borderRadius: '12px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'Tajawal', Arial" }}>
                      اعتماد
                    </button>
                  </form>

                  <form action={updateReviewStatusAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="hidden" />
                    <button type="submit" style={{ minHeight: '40px', padding: '0.62rem 0.95rem', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', color: '#555', fontWeight: 800, cursor: 'pointer', fontFamily: "'Tajawal', Arial" }}>
                      إخفاء
                    </button>
                  </form>

                  <form action={deleteReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <button type="submit" style={{ minHeight: '40px', padding: '0.62rem 0.95rem', borderRadius: '12px', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', fontWeight: 800, cursor: 'pointer', fontFamily: "'Tajawal', Arial" }}>
                      حذف
                    </button>
                  </form>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
