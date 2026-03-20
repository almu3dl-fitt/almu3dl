import Link from 'next/link'
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
    <div style={{ padding: '2rem', fontFamily: "'Tajawal', Arial", direction: 'rtl' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');`}</style>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>لوحة الإدارة</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>مرحباً بك في لوحة إدارة المعضل</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#777', fontSize: '0.85rem', marginBottom: '0.5rem' }}>المنتجات</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{productsCount ?? 0}</p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#777', fontSize: '0.85rem', marginBottom: '0.5rem' }}>الطلبات</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ordersCount ?? 0}</p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#777', fontSize: '0.85rem', marginBottom: '0.5rem' }}>الإيراد</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalRevenue} ريال</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
        <Link href="/admin/products" style={{
          padding: '1.25rem',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '10px',
          textDecoration: 'none',
          color: '#1a1a1a',
          display: 'block',
        }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>📦</p>
          <p style={{ fontWeight: 700 }}>المنتجات</p>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>إدارة وتعديل المنتجات</p>
        </Link>
        <Link href="/admin/orders" style={{
          padding: '1.25rem',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '10px',
          textDecoration: 'none',
          color: '#1a1a1a',
          display: 'block',
        }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🧾</p>
          <p style={{ fontWeight: 700 }}>الطلبات</p>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>عرض وإدارة الطلبات</p>
        </Link>
        <Link href="/admin/reviews" style={{
          padding: '1.25rem',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '10px',
          textDecoration: 'none',
          color: '#1a1a1a',
          display: 'block',
        }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>⭐</p>
          <p style={{ fontWeight: 700 }}>التقييمات</p>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>مراجعة تقييمات المشترين</p>
        </Link>
      </div>
    </div>
  )
}
