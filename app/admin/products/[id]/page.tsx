'use client'

import { use, useEffect, useEffectEvent, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

type AdminCategory = {
  id: string
  name: string
}

type AdminProductFile = {
  id: string
  file_name: string
  storage_path: string
}

type AdminProductImage = {
  path: string
  url: string
  fileName: string
  isLegacy: boolean
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

type ProductDetailsResponse = {
  error?: string
  product?: EditableProduct
  files?: AdminProductFile[]
  images?: AdminProductImage[]
}

type CategoriesResponse = {
  error?: string
  categories?: AdminCategory[]
}

type NoticeState = {
  type: 'success' | 'error' | 'warning'
  text: string
} | null

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [files, setFiles] = useState<AdminProductFile[]>([])
  const [images, setImages] = useState<AdminProductImage[]>([])
  const [newFiles, setNewFiles] = useState<FileList | null>(null)
  const [newImages, setNewImages] = useState<FileList | null>(null)
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

  const loadProduct = async () => {
    const response = await fetch(`/api/admin/products/${id}`, {
      cache: 'no-store',
    })

    const data = (await response.json()) as ProductDetailsResponse

    if (!response.ok || !data.product) {
      throw new Error(data.error || 'تعذر تحميل بيانات المنتج.')
    }

    const product = data.product

    setFiles(data.files ?? [])
    setImages(data.images ?? [])
    setNewFiles(null)
    setNewImages(null)
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

  const loadCategories = async () => {
    const response = await fetch('/api/admin/categories', {
      cache: 'no-store',
    })

    const data = (await response.json()) as CategoriesResponse

    if (!response.ok) {
      throw new Error(data.error || 'تعذر تحميل الفئات.')
    }

    setCategories(data.categories ?? [])
  }

  const loadInitialData = useEffectEvent(async () => {
    setLoading(true)

    try {
      await Promise.all([loadProduct(), loadCategories()])
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadInitialData().catch(error => {
        const message = error instanceof Error ? error.message : 'تعذر تحميل بيانات المنتج.'
        setNotice({
          type: 'error',
          text: message,
        })
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [id])

  useEffect(() => {
    const noticeText = searchParams.get('notice')
    const noticeType = searchParams.get('noticeType')

    if (!noticeText) {
      return
    }

    setNotice({
      type: noticeType === 'error' || noticeType === 'warning' || noticeType === 'success'
        ? noticeType
        : 'warning',
      text: noticeText,
    })
  }, [searchParams])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const formData = new FormData()
    formData.set('title', form.title)
    formData.set('slug', form.slug)
    formData.set('description', form.description)
    formData.set('price', form.price || '0')
    formData.set('is_free', String(form.is_free))
    formData.set('level', form.level)
    formData.set('category_id', form.category_id)
    formData.set('is_active', String(form.is_active))
    formData.set('tags', form.tags)

    if (newFiles?.length) {
      Array.from(newFiles).forEach(file => {
        formData.append('files', file)
      })
    }

    if (newImages?.length) {
      Array.from(newImages).forEach(file => {
        formData.append('images', file)
      })
    }

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: formData,
      })

      const data = (await response.json()) as { error?: string; warning?: string }

      if (!response.ok) {
        setNotice({
          type: 'error',
          text: data.error || 'تعذر حفظ التعديلات الآن.',
        })
        return
      }

      await loadProduct()
      router.refresh()
      setNotice({
        type: data.warning ? 'warning' : 'success',
        text: data.warning || 'تم حفظ التعديلات بنجاح.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر حفظ التعديلات الآن.'
      setNotice({
        type: 'error',
        text: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('هل تريد حذف هذا الملف؟')) return

    try {
      const response = await fetch(`/api/admin/product-files/${fileId}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setNotice({
          type: 'error',
          text: data.error || 'تعذر حذف الملف الآن.',
        })
        return
      }

      setFiles(current => current.filter(file => file.id !== fileId))
      router.refresh()
      setNotice({
        type: 'success',
        text: 'تم حذف الملف بنجاح.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر حذف الملف الآن.'
      setNotice({
        type: 'error',
        text: message,
      })
    }
  }

  const handleDeleteImage = async (imagePath: string) => {
    if (!confirm('هل تريد حذف هذه الصورة؟')) return

    try {
      const response = await fetch('/api/admin/product-images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          imagePath,
        }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setNotice({
          type: 'error',
          text: data.error || 'تعذر حذف الصورة الآن.',
        })
        return
      }

      setImages(current => current.filter(image => image.path !== imagePath))
      router.refresh()
      setNotice({
        type: 'success',
        text: 'تم حذف الصورة بنجاح.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر حذف الصورة الآن.'
      setNotice({
        type: 'error',
        text: message,
      })
    }
  }

  const handleDeleteProduct = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return
    if (!confirm('الحذف نهائي ولا يمكن التراجع — متأكد؟')) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setNotice({
          type: 'error',
          text: data.error || 'تعذر حذف المنتج الآن.',
        })
        return
      }

      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر حذف المنتج الآن.'
      setNotice({
        type: 'error',
        text: message,
      })
    } finally {
      setDeleting(false)
    }
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

      {notice && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border:
            notice.type === 'success'
              ? '1px solid #bbf7d0'
              : notice.type === 'warning'
                ? '1px solid #fde68a'
                : '1px solid #fecaca',
          background:
            notice.type === 'success'
              ? '#f0fdf4'
              : notice.type === 'warning'
                ? '#fffbeb'
                : '#fef2f2',
          color:
            notice.type === 'success'
              ? '#166534'
              : notice.type === 'warning'
                ? '#92400e'
                : '#b91c1c',
          fontSize: '0.9rem',
          fontWeight: 700,
          lineHeight: 1.8,
        }}>
          {notice.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              onChange={event => setForm({ ...form, is_active: event.target.checked })} />
            {form.is_active ? '✅ المنتج نشط ومرئي في المتجر' : '❌ المنتج مخفي من المتجر'}
          </label>
        </div>

        <div>
          <label style={labelStyle}>اسم المنتج *</label>
          <input style={inputStyle} required value={form.title}
            onChange={event => setForm({ ...form, title: event.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>Slug (رابط المنتج)</label>
          <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} value={form.slug}
            onChange={event => setForm({ ...form, slug: event.target.value })} />
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

        {!form.is_free && (
          <div>
            <label style={labelStyle}>السعر (ريال) *</label>
            <input style={inputStyle} type="number" min="0" value={form.price}
              onChange={event => setForm({ ...form, price: event.target.value })} />
          </div>
        )}

        <div>
          <label style={labelStyle}>التاقز (مفصولة بفاصلة)</label>
          <input style={inputStyle} value={form.tags} placeholder="غذاء, تنحيف, مبتدئ"
            onChange={event => setForm({ ...form, tags: event.target.value })} />
        </div>

        <div style={{
          backgroundColor: '#f9f9f9',
          border: '1px solid #eee',
          borderRadius: '8px',
          padding: '1rem',
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            🖼️ صور المنتج ({images.length})
          </h3>

          <p style={{ margin: '0 0 0.75rem', color: '#777', fontSize: '0.82rem', lineHeight: 1.8 }}>
            أول صورة تظهر كمصغّرة في المتجر، ويمكنك رفع صورة واحدة أو عدة صور بشكل اختياري.
          </p>

          {images.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.85rem' }}>لا توجد صور مضافة لهذا المنتج.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
            }}>
              {images.map((image, index) => (
                <div key={image.path} style={{
                  overflow: 'hidden',
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                }}>
                  <div style={{ position: 'relative', aspectRatio: '1 / 1', backgroundColor: '#f3f3f3' }}>
                    <Image
                      src={image.url}
                      alt={`صورة ${index + 1} للمنتج`}
                      fill
                      sizes="180px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '0.65rem', display: 'grid', gap: '0.45rem' }}>
                    <div style={{ color: '#666', fontSize: '0.78rem', fontWeight: 700 }}>
                      {index === 0 ? 'الصورة المصغّرة الحالية' : `صورة إضافية ${index + 1}`}
                    </div>
                    {image.isLegacy ? (
                      <div style={{
                        border: '1px solid #e5e7eb',
                        color: '#6b7280',
                        borderRadius: '6px',
                        padding: '0.35rem 0.55rem',
                        fontSize: '0.78rem',
                        lineHeight: 1.7,
                      }}>
                        صورة افتراضية مرتبطة بالواجهة ويمكن استبدالها برفع صورة جديدة.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.path)}
                        style={{
                          background: 'none',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '0.35rem 0.55rem',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontFamily: "'Tajawal', Arial",
                        }}
                      >
                        حذف الصورة
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>إضافة صور جديدة</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={event => setNewImages(event.target.files)}
              style={{ fontSize: '0.85rem' }}
            />
            {newImages && newImages.length > 0 && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#555' }}>
                {Array.from(newImages).map((image, index) => (
                  <div key={index}>🖼️ {image.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                    }}>
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>إضافة ملفات جديدة</label>
            <input type="file" accept=".pdf,.mp4,.zip" multiple
              onChange={event => setNewFiles(event.target.files)}
              style={{ fontSize: '0.85rem' }} />
            {newFiles && newFiles.length > 0 && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#555' }}>
                {Array.from(newFiles).map((file, index) => (
                  <div key={index}>📎 {file.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>

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
