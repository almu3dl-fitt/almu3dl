import AdminPageHeader from '@/app/admin/components/AdminPageHeader'
import AdminStatCard from '@/app/admin/components/AdminStatCard'
import { deleteReviewAction, updateReviewStatusAction } from '@/app/admin/reviews/actions'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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

const statusTheme: Record<string, { label: string; tone: 'success' | 'warning' | 'muted' }> = {
  approved: { label: 'معتمد', tone: 'success' },
  pending: { label: 'بانتظار المراجعة', tone: 'warning' },
  hidden: { label: 'مخفي', tone: 'muted' },
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

  const pendingReviews = reviews.filter(review => review.status === 'pending')
  const pendingCount = reviews.filter(review => review.status === 'pending').length
  const approvedCount = reviews.filter(review => review.status === 'approved').length

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="إدارة التقييمات"
        title="التقييمات"
        description="راجع تقييمات المشترين المعلقة بسرعة، واعتمد المناسب منها أو أخفه أو احذفه عند الحاجة."
        backHref="/admin"
        backLabel="الرجوع للرئيسية"
      />

      <div className="admin-stats-grid">
        <AdminStatCard
          label="بانتظار المراجعة"
          value={String(pendingCount)}
          helper="التقييمات التي تحتاج قرارًا منك الآن."
          tone="warning"
        />
        <AdminStatCard
          label="معتمد"
          value={String(approvedCount)}
          helper="التقييمات الظاهرة حاليًا في المتجر."
          tone="success"
        />
        <AdminStatCard
          label="إجمالي التقييمات"
          value={String(reviews.length)}
          helper="يشمل المعتمد والمخفي وقيد المراجعة."
          tone="accent"
        />
      </div>

      {pendingReviews.length === 0 ? (
        <div className="admin-empty">
          {reviews.length === 0
            ? 'لا توجد تقييمات بعد. إذا كانت الميزة مفعلة ولم تظهر هنا، فتأكد من تطبيق migration الخاصة بالتقييمات.'
            : 'لا توجد تقييمات بانتظار المراجعة الآن.'}
        </div>
      ) : (
        <div className="admin-review-list">
          {pendingReviews.map(review => {
            const status = statusTheme[review.status] || statusTheme.pending

            return (
              <article key={review.id} className="admin-review-card">
                <div className="admin-card-head">
                  <div>
                    <h2 className="admin-card-title">{review.product?.title || 'منتج محذوف'}</h2>
                    <p className="admin-card-subtitle">
                      {review.customer_name || review.customer_email}
                    </p>
                    <p className="admin-card-subtitle">{review.customer_email}</p>
                  </div>

                  <div className="admin-card-meta">
                    <span className={`admin-status-badge is-${status.tone}`}>{status.label}</span>
                    <span className="admin-tag">
                      {new Intl.DateTimeFormat('ar-SA', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(review.created_at))}
                    </span>
                  </div>
                </div>

                <div className="admin-order-foot">
                  <div className="admin-tag-list">
                    <span className="admin-tag">
                      {'★'.repeat(review.rating).padEnd(5, '☆')}
                    </span>
                    <span className="admin-tag">
                      {review.order?.id ? `الطلب #${review.order.id.slice(0, 8)}` : 'بدون طلب ظاهر'}
                    </span>
                  </div>
                </div>

                <div className="admin-order-products">
                  <div className="admin-help" style={{ color: 'var(--admin-text-soft)', fontSize: '0.88rem' }}>
                    {review.comment?.trim() || 'بدون تعليق نصي.'}
                  </div>
                </div>

                <div className="admin-actions-row">
                  <form action={updateReviewStatusAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className="admin-button">
                      اعتماد
                    </button>
                  </form>

                  <form action={updateReviewStatusAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="hidden" />
                    <button type="submit" className="admin-button-secondary">
                      إخفاء
                    </button>
                  </form>

                  <form action={deleteReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <button type="submit" className="admin-button-danger">
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
