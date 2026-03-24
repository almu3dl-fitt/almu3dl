import Link from 'next/link'
import AdminPageHeader from '@/app/admin/components/AdminPageHeader'
import AdminStatCard from '@/app/admin/components/AdminStatCard'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { count: productsCount } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: ordersCount } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { data: revenueData } = await supabaseAdmin
    .from('orders')
    .select('amount')
    .eq('status', 'paid')

  const { count: pendingOrdersCount } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: failedOrdersCount } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')

  const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.amount), 0) ?? 0

  const { data: recentOrdersData } = await supabaseAdmin
    .from('orders')
    .select('id, amount, status, customer_name, customer_email, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentOrders = (recentOrdersData ?? []) as {
    id: string
    amount: number
    status: string
    customer_name: string | null
    customer_email: string | null
    created_at: string
  }[]

  const statusLabels: Record<string, { label: string; tone: string }> = {
    paid: { label: 'مدفوع', tone: 'success' },
    pending: { label: 'معلّق', tone: 'warning' },
    failed: { label: 'فشل', tone: 'danger' },
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="نظرة عامة"
        title="لوحة الإدارة"
        description="واجهة إدارة مرتبة لمتابعة المنتجات والطلبات والتقييمات بسرعة، مع رؤية أوضح للحالات التي تحتاج تدخلًا مباشرًا."
        actions={
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="admin-button-secondary">
            تسجيل الخروج من الإدارة
          </button>
        </form>
        }
      />

      <div className="admin-stats-grid">
        <AdminStatCard
          label="إجمالي المنتجات"
          value={String(productsCount ?? 0)}
          helper="كل المنتجات الظاهرة والمخفية في قاعدة المتجر."
          tone="accent"
        />
        <AdminStatCard
          label="إجمالي الطلبات"
          value={String(ordersCount ?? 0)}
          helper="جميع الطلبات التي تم إنشاؤها داخل المتجر."
          tone="default"
        />
        <AdminStatCard
          label="طلبات تحتاج متابعة"
          value={String((pendingOrdersCount ?? 0) + (failedOrdersCount ?? 0))}
          helper={`${pendingOrdersCount ?? 0} معلّق و${failedOrdersCount ?? 0} فاشل.`}
          tone={(pendingOrdersCount ?? 0) + (failedOrdersCount ?? 0) > 0 ? 'warning' : 'success'}
        />
        <AdminStatCard
          label="الإيراد المدفوع"
          value={`${totalRevenue} ريال`}
          helper="إجمالي المبالغ من الطلبات المدفوعة فقط."
          tone="success"
        />
      </div>

      <div className="admin-actions-grid">
        <Link href="/admin/products" className="admin-action-card">
          <span className="admin-action-icon">PR</span>
          <div className="admin-action-title">إدارة المنتجات</div>
          <div className="admin-action-copy">ابحث بسرعة عن المنتج، عدّل بياناته، أو أضف منتجًا جديدًا.</div>
        </Link>

        <Link href="/admin/orders" className="admin-action-card">
          <span className="admin-action-icon">OR</span>
          <div className="admin-action-title">الطلبات والمدفوعات</div>
          <div className="admin-action-copy">تابع الحالات المعلقة والفاشلة واحذف الطلبات التي لم تكتمل.</div>
        </Link>

        <Link href="/admin/reviews" className="admin-action-card">
          <span className="admin-action-icon">RV</span>
          <div className="admin-action-title">مراجعة التقييمات</div>
          <div className="admin-action-copy">اعتمد تقييمات العملاء الجديدة أو أخفها أو احذفها عند الحاجة.</div>
        </Link>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-head">
          <h2 className="admin-section-title">آخر الطلبات</h2>
          <p className="admin-section-copy">
            ملخص سريع لآخر النشاط داخل المتجر حتى تصل للحالة المطلوبة بدون تنقل كثير.
          </p>
        </div>

        {recentOrders.length === 0 ? (
          <div className="admin-empty">لا توجد طلبات حديثة لعرضها الآن.</div>
        ) : (
          <div className="admin-order-list">
            {recentOrders.map(order => {
              const status = statusLabels[order.status] || {
                label: order.status,
                tone: 'muted',
              }

              return (
                <div key={order.id} className="admin-order-card">
                  <div className="admin-card-head">
                    <div>
                      <h3 className="admin-card-title">{order.customer_name || 'عميل بدون اسم'}</h3>
                      <p className="admin-card-subtitle">{order.customer_email || 'بدون بريد مسجل'}</p>
                    </div>

                    <div className="admin-card-meta">
                      <span className={`admin-status-badge is-${status.tone}`}>{status.label}</span>
                      <span className="admin-total">
                        {Number(order.amount) === 0 ? 'مجاني' : `${order.amount} ريال`}
                      </span>
                    </div>
                  </div>

                  <div className="admin-order-foot">
                    <div className="admin-meta-block">
                      <span>#{order.id.slice(0, 8)}</span>
                      <span>
                        {new Intl.DateTimeFormat('ar-SA', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(order.created_at))}
                      </span>
                    </div>

                    <Link href="/admin/orders" className="admin-inline-link">
                      فتح صفحة الطلبات
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
