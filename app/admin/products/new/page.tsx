'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type AdminCategory = {
  id: string
  name: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    is_free: false,
    level: 'beginner',
    slug: '',
    category_id: '',
    is_active: true,
    tags: '',
  })

  const loadCategories = useEffectEvent(async () => {
    const response = await fetch('/api/admin/categories', {
      cache: 'no-store',
    })

    const data = (await response.json()) as { error?: string; categories?: AdminCategory[] }

    if (!response.ok) {
      throw new Error(data.error || 'تعذر تحميل الفئات.')
    }

    setCategories(data.categories ?? [])
  })

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadCategories().catch(error => {
        const message = error instanceof Error ? error.message : 'تعذر تحميل الفئات.'
        alert(message)
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.set('title', form.title)
    formData.set('description', form.description)
    formData.set('price', form.price || '0')
    formData.set('is_free', String(form.is_free))
    formData.set('level', form.level)
    formData.set('slug', form.slug)
    formData.set('category_id', form.category_id)
    formData.set('is_active', String(form.is_active))
    formData.set('tags', form.tags)

    if (files?.length) {
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as { error?: string; id?: string }

      if (!response.ok || !data.id) {
        alert(data.error || 'خطأ في حفظ المنتج.')
        return
      }

      router.push(`/admin/products/${data.id}`)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطأ في حفظ المنتج.'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'Arial',
    direction: 'rtl' as const,
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '0.25rem',
    fontWeight: 'bold' as const,
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', direction: 'rtl', maxWidth: '600px' }}>
      <Link href="/admin/products" style={{ color: '#888', fontSize: '14px' }}>← رجوع للمنتجات</Link>
      <h1 style={{ margin: '1rem 0' }}>إضافة منتج جديد</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>اسم المنتج *</label>
          <input style={inputStyle} required value={form.title}
            onChange={event => setForm({ ...form, title: event.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>الوصف</label>
          <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
            value={form.description}
            onChange={event => setForm({ ...form, description: event.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>الفئة</label>
          <select style={inputStyle} value={form.category_id}
            onChange={event => setForm({ ...form, category_id: event.target.value })}>
            <option value="">— بدون فئة —</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>المستوى</label>
          <select style={inputStyle} value={form.level}
            onChange={event => setForm({ ...form, level: event.target.value })}>
            <option value="beginner">مبتدئ</option>
            <option value="intermediate">متوسط</option>
            <option value="all">الكل</option>
          </select>
        </div>

        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={form.is_free}
              onChange={event => setForm({ ...form, is_free: event.target.checked })} />
            منتج مجاني
          </label>
        </div>

        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={form.is_active}
              onChange={event => setForm({ ...form, is_active: event.target.checked })} />
            المنتج ظاهر في المتجر
          </label>
        </div>

        {!form.is_free && (
          <div>
            <label style={labelStyle}>السعر (ريال) *</label>
            <input style={inputStyle} type="number" min="0" value={form.price}
              onChange={event => setForm({ ...form, price: event.target.value })} />
          </div>
        )}

        <div>
          <label style={labelStyle}>Slug (اختياري)</label>
          <input style={inputStyle} value={form.slug} placeholder="beginner-program-4-days"
            onChange={event => setForm({ ...form, slug: event.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>التاقز (مفصولة بفاصلة)</label>
          <input style={inputStyle} value={form.tags} placeholder="تمارين, غذاء, متوسط"
            onChange={event => setForm({ ...form, tags: event.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>ملفات المنتج (يمكن اختيار أكثر من ملف)</label>
          <input
            type="file"
            accept=".pdf,.mp4,.zip"
            multiple
            onChange={event => setFiles(event.target.files)}
            style={{ ...inputStyle, padding: '0.4rem' }}
          />
          {files && files.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '13px', color: '#555' }}>
              {Array.from(files).map((file, index) => (
                <div key={index}>📄 {file.name}</div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={{
          background: '#000',
          color: '#fff',
          padding: '0.75rem',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? '⏳ جاري الحفظ والرفع...' : 'حفظ المنتج'}
        </button>
      </form>
    </div>
  )
}
