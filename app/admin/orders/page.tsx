import Link from 'next/link'
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

export default async function AdminOrdersPage() {
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

  const statusLabel: Record<string, string> = {
    paid: '✅ مدفوع',
    pending: '⏳ معلّق',
    failed: '❌ فشل',
  }

  const safeOrders = (orders ?? []) as AdminOrder[]

  return (
    <div style={{ padding: '2rem', fontFamily: "'Tajawal', Arial", direction: 'rtl' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>الطلبات</h1>
        <Link href="/admin" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>← لوحة الإدارة</Link>
      </div>

      {/* إحصائيات سريعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>
            {safeOrders.filter(order => order.status === 'paid').length}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#777' }}>طلب مدفوع</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#fef9ee', border: '1px solid #fde68a', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#B8912E' }}>
            {safeOrders
              .filter(order => order.status === 'paid')
              .reduce((sum, order) => sum + Number(order.amount), 0)} ريال
          </p>
          <p style={{ fontSize: '0.8rem', color: '#777' }}>إجمالي الإيرادات</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#555' }}>
            {safeOrders.length}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#777' }}>إجمالي الطلبات</p>
        </div>
      </div>

      {safeOrders.length === 0 ? (
        <p style={{ color: '#888', marginTop: '2rem', textAlign: 'center' }}>لا توجد طلبات بعد</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {safeOrders.map(order => (
            <div key={order.id} style={{
              backgroundColor: '#fff',
              border: '1px solid #eee',
              borderRadius: '10px',
              padding: '1.25rem',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {order.customer_name || '—'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#777' }}>{order.customer_email || '—'}</p>
                  {order.customer_phone && (
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>📱 {order.customer_phone}</p>
                  )}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: order.status === 'paid' ? '#f0fdf4' : order.status === 'pending' ? '#fef9ee' : '#fef2f2',
                    color: order.status === 'paid' ? '#16a34a' : order.status === 'pending' ? '#B8912E' : '#dc2626',
                    border: `1px solid ${order.status === 'paid' ? '#bbf7d0' : order.status === 'pending' ? '#fde68a' : '#fecaca'}`,
                  }}>
                    {statusLabel[order.status] || order.status}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.4rem' }}>
                    {new Date(order.created_at).toLocaleDateString('ar-SA')} — {new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* المنتجات */}
              <div style={{
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
              }}>
                {order.order_items?.map((item, index) => {
                  const product = Array.isArray(item.products)
                    ? item.products[0]
                    : item.products

                  return (
                    <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    padding: '0.25rem 0',
                    borderBottom:
                      index < (order.order_items?.length ?? 0) - 1 ? '1px solid #eee' : 'none',
                  }}>
                    <span>{product?.title || '—'}</span>
                    <span style={{ color: '#B8912E', fontWeight: 600 }}>
                      {Number(item.price_paid) === 0 ? 'مجاني' : `${item.price_paid} ريال`}
                    </span>
                  </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#999' }}>
                  #{order.id.slice(0, 8)}
                  {order.paypal_id && <span> • PayPal: {order.paypal_id.slice(0, 12)}...</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#B8912E' }}>
                    {Number(order.amount) === 0 ? 'مجاني' : `${order.amount} ريال`}
                  </span>
                  {order.status === 'paid' && (
                    <Link href={`/success?order=${order.id}`} target="_blank" style={{
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>📦 صفحة التحميل</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
