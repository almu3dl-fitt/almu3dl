'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    is_free: false,
    level: 'beginner',
    slug: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('products').insert({
      title: form.title,
      description: form.description,
      price: form.is_free ? 0 : Number(form.price),
      is_free: form.is_free,
      level: form.level,
      slug: form.slug || form.title.replace(/\s+/g, '-'),
      is_active: true,
    })

    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      router.push('/admin/products')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '0.5rem', fontSize: '1rem',
    border: '1px solid #ddd', borderRadius: '6px',
    fontFamily: 'Arial', direction: 'rtl' as const
  }
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', direction: 'rtl', maxWidth: '600px' }}>
      <h1>إضافة منتج جديد</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>اسم المنتج *</label>
          <input style={inputStyle} required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>الوصف</label>
          <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>المستوى</label>
          <select style={inputStyle} value={form.level}
            onChange={e => setForm({ ...form, level: e.target.value })}>
            <option value="beginner">مبتدئ</option>
            <option value="intermediate">متوسط</option>
            <option value="all">الكل</option>
          </select>
        </div>

        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={form.is_free}
              onChange={e => setForm({ ...form, is_free: e.target.checked })} />
            منتج مجاني
          </label>
        </div>

        {!form.is_free && (
          <div>
            <label style={labelStyle}>السعر (ريال) *</label>
            <input style={inputStyle} type="number" min="0" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
        )}

        <div>
          <label style={labelStyle}>Slug (اختياري — يُنشأ تلقائياً)</label>
          <input style={inputStyle} value={form.slug} placeholder="مثال: beginner-program"
            onChange={e => setForm({ ...form, slug: e.target.value })} />
        </div>

        <button type="submit" disabled={loading} style={{
          background: '#000', color: '#fff', padding: '0.75rem',
          border: 'none', borderRadius: '8px', fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
        </button>
      </form>
    </div>
  )
}
