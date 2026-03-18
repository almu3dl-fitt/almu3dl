import { supabase } from '@/lib/supabase'

export default async function AdminPage() {
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { data: revenueData } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')

  const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.amount), 0) ?? 0

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', direction: 'rtl' }}>
      <h1>لوحة الإدارة</h1>
      <p>مرحباً بك في لوحة إدارة almu3dl</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>المنتجات</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{productsCount ?? 0}</p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>الطلبات</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ordersCount ?? 0}</p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>الإيراد</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalRevenue} ريال</p>
        </div>
      </div>
    </div>
  )
}