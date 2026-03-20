'use client'

import { useState, useEffect, use, useEffectEvent } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

type AdminCategory = {
  id: string
  name: string
}

type AdminProductFile = {
  id: string
  file_name: string
  storage_path: string
}

type EditableProduct = {
  title: string | null
  slug: string | null
  description: string | null
  price: number | null
  is_free: boolean | null
  level: string | null
  category_id: string | null
  is_active: boolean | null
  tags: string[] | null
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [files, setFiles] = useState<AdminProductFile[]>([])
  const [newFiles, setNewFiles] = useState<FileList | null>(null)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    is_free: false,
    level: 'beginner',
    category_id: '',
    is_active: true,
    tags: '',
  })

  const loadProduct = useEffectEvent(async () => {
    const { data } = await supabaseBrowser
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    const product = data as EditableProduct | null

    if (product) {
      setForm({
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price?.toString() || '0',
        is_free: product.is_free || false,
        level: product.level || 'beginner',
        category_id: product.category_id || '',
        is_active: product.is_active ?? true,
        tags: product.tags?.join(', ') || '',
      })
    }
    setLoading(false)
  })

  const loadCategories = useEffectEvent(async () => {
    const { data } = await supabaseBrowser.from('categories').select('*').order('name')
    setCategories((data as AdminCategory[] | null) || [])
  })

  async function refreshFiles() {
    const { data } = await supabaseBrowser
      .from('product_files')
      .select('*')
      .eq('product_id', id)
      .order('sort_order')
    setFiles((data as AdminProductFile[] | null) || [])
  }

  const loadFilesEffect = useEffectEvent(async () => {
    await refreshFiles()
  })

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadProduct()
      void loadCategories()
      void loadFilesEffect()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

    const { error } = await supabaseBrowser
      .from('products')
      .update({
        title: form.title,
        slug: form.slug,
        description: form.description,
        price: form.is_free ? 0 : Number(form.price),
        is_free: form.is_free,
        level: form.level,
        category_id: form.category_id || null,
        is_active: form.is_active,
        tags,
      })
      .eq('id', id)

    if (error) {
      alert('خطأ في الحفظ: ' + error.message)
      setSaving(false)
      return
    }

    // رفع ملفات جديدة لو موجودة
    if (newFiles && newFiles.length > 0) {
      const currentMax = files.length
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i]
        const filePath = `product ID/${file.name}`

        await supabaseBrowser.storage.from('products').upload(filePath, file, { upsert: true })

        await supabaseBrowser.from('product_files').insert({
          product_id: id,
          file_name: file.name,
          storage_path: filePath,
          sort_order: currentMax + i,
        })
      }
      setNewFiles(null)
      refreshFiles()
    }

    alert('تم الحفظ بنجاح ✅')
    setSaving(false)
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('هل تريد حذف هذا الملف؟')) return

    await supabaseBrowser.from('product_files').delete().eq('id', fileId)
    setFiles(current => current.filter(file => file.id !== fileId))
  }

  const handleDeleteProduct = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return
    if (!confirm('الحذف نهائي ولا يمكن التراجع — متأكد؟')) return

    setDeleting(true)

    // حذف الملفات أولاً
    await supabaseBrowser.from('product_files').delete().eq('product_id', id)
    // حذف المنتج
    const { error } = await supabaseBrowser.from('products').delete().eq('id', id)

    if (error) {
      alert('خطأ في الحذف: ' + error.message)
      setDeleting(false)
      return
    }

    router.push('/admin/products')
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontFamily: "'Tajawal', Arial, sans-serif",
    direction: 'rtl' as const,
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '0.3rem',
    fontWeight: 'bold' as const,
    fontSize: '0.9rem',
    color: '#333',
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'Arial', direction: 'rtl', textAlign: 'center' }}>
        <p>⏳ جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: "'Tajawal', Arial", direction: 'rtl', maxWidth: '700px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>تعديل المنتج</h1>
        <Link href="/admin/products" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>← رجوع للمنتجات</Link>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* الحالة */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: form.is_active ? '#f0fdf4' : '#fef2f2',
          borderRadius: '8px',
          border: `1px solid ${form.is_active ? '#bbf7d0' : '#fecaca'}`,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            {form.is_active ? '✅ المنتج نشط ومرئي في المتجر' : '❌ المنتج مخفي من المتجر'}
          </label>
        </div>

        {/* اسم المنتج */}
        <div>
          <label style={labelStyle}>اسم المنتج *</label>
          <input style={inputStyle} required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Slug (رابط المنتج)</label>
          <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })} />
        </div>

        {/* الوصف */}
        <div>
          <label style={labelStyle}>الوصف</label>
          <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        {/* الفئة */}
        <div>
          <label style={labelStyle}>الفئة</label>
          <select style={inputStyle} value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}>
            <option value="">— بدون فئة —</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* المستوى */}
        <div>
          <label style={labelStyle}>المستوى</label>
          <select style={inputStyle} value={form.level}
            onChange={e => setForm({ ...form, level: e.target.value })}>
            <option value="beginner">مبتدئ</option>
            <option value="intermediate">متوسط</option>
            <option value="all">الكل</option>
          </select>
        </div>

        {/* مجاني */}
        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={form.is_free}
              onChange={e => setForm({ ...form, is_free: e.target.checked })} />
            منتج مجاني
          </label>
        </div>

        {/* السعر */}
        {!form.is_free && (
          <div>
            <label style={labelStyle}>السعر (ريال) *</label>
            <input style={inputStyle} type="number" min="0" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
        )}

        {/* التاقز */}
        <div>
          <label style={labelStyle}>التاقز (مفصولة بفاصلة)</label>
          <input style={inputStyle} value={form.tags} placeholder="غذاء, تنحيف, مبتدئ"
            onChange={e => setForm({ ...form, tags: e.target.value })} />
        </div>

        {/* === الملفات الحالية === */}
        <div style={{
          backgroundColor: '#f9f9f9',
          border: '1px solid #eee',
          borderRadius: '8px',
          padding: '1rem',
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            📁 الملفات المرفقة ({files.length})
          </h3>
          {files.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.85rem' }}>لا توجد ملفات</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {files.map(file => (
                <div key={file.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#fff',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}>
                  <span>📄 {file.file_name}</span>
                  <button type="button" onClick={() => handleDeleteFile(file.id)}
                    style={{
                      background: 'none',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontFamily: "'Tajawal', Arial",
                    }}>حذف</button>
                </div>
              ))}
            </div>
          )}

          {/* رفع ملفات جديدة */}
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>إضافة ملفات جديدة</label>
            <input type="file" accept=".pdf,.mp4,.zip" multiple
              onChange={e => setNewFiles(e.target.files)}
              style={{ fontSize: '0.85rem' }} />
            {newFiles && newFiles.length > 0 && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#555' }}>
                {Array.from(newFiles).map((f, i) => (
                  <div key={i}>📎 {f.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* أزرار */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="submit" disabled={saving} style={{
            flex: 1,
            background: 'linear-gradient(135deg, #D4A843, #B8912E)',
            color: '#fff',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            fontFamily: "'Tajawal', Arial",
          }}>
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التعديلات'}
          </button>

          <button type="button" onClick={handleDeleteProduct} disabled={deleting} style={{
            background: '#fff',
            color: '#dc2626',
            padding: '0.75rem 1.5rem',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: deleting ? 'not-allowed' : 'pointer',
            fontFamily: "'Tajawal', Arial",
          }}>
            {deleting ? '⏳...' : '🗑️ حذف'}
          </button>
        </div>
      </form>
    </div>
  )
}
