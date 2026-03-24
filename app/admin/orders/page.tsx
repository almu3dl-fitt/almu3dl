import Link from 'next/link'
import AdminPageHeader from '@/app/admin/components/AdminPageHeader'
import AdminStatCard from '@/app/admin/components/AdminStatCard'
import AdminOrderDeleteButton from '@/app/admin/orders/AdminOrderDeleteButton'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type AdminOrderItem = {
  id: string
  price_paid: number
  products: { title: string } | { title: string }[] | null
}

type AdminOrder = {
  id: string
  amount: number
  status: string
  paypal_id: string | null
  customer_email: string | null
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  order_items: AdminOrderItem[] | null
}

type OrdersSearchParams = {
  q?: string
  status?: string
}

function normalizeProduct(
  value: { title: string } | { title: string }[] | null,
) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams> | OrdersSearchParams
}) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const statusFilter = ['all', 'paid', 'pending', 'failed'].includes(params.status ?? '')
    ? params.status ?? 'all'
    : 'all'

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      amount,
      status,
      paypal_id,
      customer_email,
      customer_name,
      customer_phone,
      created_at,
      order_items ( id, price_paid, products ( title ) )
    `)
    .order('created_at', { ascending: false })

  const safeOrders = (orders ?? []) as AdminOrder[]

  const filteredOrders = safeOrders.filter(order => {
    const matchesQuery = query
      ? [
          order.id,
          order.customer_name ?? '',
          order.customer_email ?? '',
          order.customer_phone ?? '',
          order.paypal_id ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      : true

    const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter
    return matchesQuery && matchesStatus
  })

  const paidOrders = safeOrders.filter(order => order.status === 'paid')
  const pendingOrders = safeOrders.filter(order => order.status === 'pending')
  const failedOrders = safeOrders.filter(order => order.status === 'failed')
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.amount), 0)

  const statusTheme: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' }> = {
    paid: { label: 'مدفوع', tone: 'success' },
    pending: { label: 'معلّق', tone: 'warning' },
    failed: { label: 'فشل', tone: 'danger' },
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="إدارة الطلبات"
        title="الطلبات والمدفوعات"
        description="تابع الطلبات بسرعة، راجع الحالات المعلقة والفاشلة، واحذف الطلبات غير المكتملة حتى تبقى اللوحة مرتبة وواضحة."
        backHref="/admin"
        backLabel="الرجوع للرئيسية"
      />

      <div className="admin-stats-grid">
        <AdminStatCard
          label="مدفوع"
          value={String(paidOrders.length)}
          helper="الطلبات التي اكتمل سدادها بنجاح."
          tone="success"
        />
        <AdminStatCard
          label="معلّق"
          value={String(pendingOrders.length)}
          helper="طلبات بدأت ولم تكتمل بعد."
          tone="warning"
        />
        <AdminStatCard
          label="فشل"
          value={String(failedOrders.length)}
          helper="محاولات لم تتم بنجاح ويمكن تنظيفها."
          tone="danger"
        />
        <AdminStatCard
          label="إجمالي الإيرادات"
          value={`${totalRevenue} ريال`}
          helper="يُحتسب من الطلبات المدفوعة فقط."
          tone="accent"
        />
      </div>

      <form className="admin-toolbar" method="get">
        <div className="admin-toolbar-grid">
          <div className="admin-field">
            <label htmlFor="orders-q" className="admin-label">بحث سريع</label>
            <input
              id="orders-q"
              name="q"
              defaultValue={query}
              className="admin-input"
              placeholder="ابحث بالاسم أو البريد أو رقم الطلب أو PayPal"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="orders-status" className="admin-label">الحالة</label>
            <select id="orders-status" name="status" defaultValue={statusFilter} className="admin-select">
              <option value="all">كل الحالات</option>
              <option value="paid">مدفوع</option>
              <option value="pending">معلّق</option>
              <option value="failed">فشل</option>
            </select>
          </div>
        </div>

        <div className="admin-toolbar-actions">
          <button type="submit" className="admin-button">تطبيق التصفية</button>
          <Link href="/admin/orders" className="admin-button-secondary">إعادة الضبط</Link>
          <span className="admin-help">
            المعروض الآن: {filteredOrders.length} من أصل {safeOrders.length} طلب.
          </span>
        </div>
      </form>

      {filteredOrders.length === 0 ? (
        <div className="admin-empty">
          لا توجد طلبات مطابقة للفلاتر الحالية. جرّب إزالة التصفية أو البحث بكلمة أخرى.
        </div>
      ) : (
        <div className="admin-order-list">
          {filteredOrders.map(order => {
            const status = statusTheme[order.status] || { label: order.status, tone: 'muted' as const }
            const shortId = `#${order.id.slice(0, 8)}`

            return (
              <article key={order.id} className="admin-order-card">
                <div className="admin-card-head">
                  <div>
                    <h2 className="admin-card-title">{order.customer_name || 'عميل بدون اسم'}</h2>
                    <p className="admin-card-subtitle">{order.customer_email || 'بدون بريد مسجل'}</p>
                    {order.customer_phone ? (
                      <p className="admin-card-subtitle">الجوال: {order.customer_phone}</p>
                    ) : null}
                  </div>

                  <div className="admin-card-meta">
                    <span className={`admin-status-badge is-${status.tone}`}>{status.label}</span>
                    <span className="admin-total">
                      {Number(order.amount) === 0 ? 'مجاني' : `${order.amount} ريال`}
                    </span>
                  </div>
                </div>

                <div className="admin-order-products">
                  {order.order_items?.length ? (
                    order.order_items.map(item => {
                      const product = normalizeProduct(item.products)

                      return (
                        <div key={item.id} className="admin-order-item">
                          <span>{product?.title || 'منتج غير متاح'}</span>
                          <strong className="admin-muted">
                            {Number(item.price_paid) === 0 ? 'مجاني' : `${item.price_paid} ريال`}
                          </strong>
                        </div>
                      )
                    })
                  ) : (
                    <div className="admin-help">لا توجد عناصر مرتبطة بهذا الطلب.</div>
                  )}
                </div>

                <div className="admin-order-foot">
                  <div className="admin-meta-block">
                    <span>{shortId}</span>
                    <span>
                      {new Intl.DateTimeFormat('ar-SA', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(order.created_at))}
                    </span>
                    {order.paypal_id ? <span>PayPal: {order.paypal_id}</span> : null}
                  </div>

                  <div className="admin-order-actions">
                    {order.status === 'paid' ? (
                      <Link href={`/success?order=${order.id}`} target="_blank" className="admin-button-secondary">
                        صفحة التحميل
                      </Link>
                    ) : null}

                    {order.status !== 'paid' ? (
                      <AdminOrderDeleteButton orderId={order.id} shortId={shortId} />
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
