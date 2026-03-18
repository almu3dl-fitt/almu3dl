import { supabase } from '@/lib/supabase'

export default async function AdminProductsPage() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>المنتجات</h1>
        <a href="/admin/products/new" style={{
          background: '#000', color: '#fff',
          padding: '0.5rem 1rem', borderRadius: '8px',
          textDecoration: 'none'
        }}>
          + إضافة منتج
        </a>
      </div>

      {products?.length === 0 && (
        <p style={{ color: '#888', marginTop: '2rem' }}>لا توجد منتجات بعد — أضف أول منتج</p>
      )}

      <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'right', padding: '0.75rem' }}>الاسم</th>
            <th style={{ textAlign: 'right', padding: '0.75rem' }}>السعر</th>
            <th style={{ textAlign: 'right', padding: '0.75rem' }}>المستوى</th>
            <th style={{ textAlign: 'right', padding: '0.75rem' }}>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {products?.map(product => (
            <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem' }}>{product.title}</td>
              <td style={{ padding: '0.75rem' }}>{product.is_free ? 'مجاني' : `${product.price} ريال`}</td>
              <td style={{ padding: '0.75rem' }}>{product.level}</td>
              <td style={{ padding: '0.75rem' }}>{product.is_active ? '✅ نشط' : '❌ مخفي'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
