'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/app/admin/components/AdminPageHeader'

type AdminCategory = {
  id: string
  name: string
}

type NoticeState = {
  type: 'success' | 'error' | 'warning'
  text: string
} | null

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  const [images, setImages] = useState<FileList | null>(null)
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
        setNotice({
          type: 'error',
          text: message,
        })
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

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

    if (images?.length) {
      Array.from(images).forEach(file => {
        formData.append('images', file)
      })
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as { error?: string; id?: string; warning?: string }

      if (!response.ok || !data.id) {
        setNotice({
          type: 'error',
          text: data.error || 'تعذر إنشاء المنتج الآن.',
        })
        return
      }

      const noticeQuery = data.warning
        ? `?notice=${encodeURIComponent(data.warning)}&noticeType=warning`
        : ''

      router.push(`/admin/products/${data.id}${noticeQuery}`)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطأ في حفظ المنتج.'
      setNotice({
        type: 'error',
        text: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="إضافة منتج"
        title="منتج جديد"
        description="أدخل الأساسيات أولًا، ثم أرفق الصور والملفات. النموذج مرتب ليكون الحفظ أسرع وأوضح."
        backHref="/admin/products"
        backLabel="الرجوع للمنتجات"
      />

      {notice ? <div className={`admin-notice is-${notice.type}`}>{notice.text}</div> : null}

      <form onSubmit={handleSubmit} className="admin-form-grid">
        <div className="admin-form-column">
          <section className="admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">البيانات الأساسية</h2>
              <p className="admin-section-copy">المعلومات التي تظهر للعميل داخل صفحة المنتج والمتجر.</p>
            </div>

            <div className="admin-field">
              <label className="admin-label">اسم المنتج *</label>
              <input
                className="admin-input"
                required
                value={form.title}
                onChange={event => setForm({ ...form, title: event.target.value })}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">الوصف</label>
              <textarea
                className="admin-textarea"
                value={form.description}
                onChange={event => setForm({ ...form, description: event.target.value })}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">الرابط المخصص (Slug)</label>
              <input
                className="admin-input is-ltr"
                placeholder="beginner-program-4-days"
                value={form.slug}
                onChange={event => setForm({ ...form, slug: event.target.value })}
              />
              <span className="admin-help">يمكن تركه فارغًا وسيتم توليده تلقائيًا من اسم المنتج.</span>
            </div>

            <div className="admin-field">
              <label className="admin-label">التاقات</label>
              <input
                className="admin-input"
                placeholder="تمارين, غذاء, متوسط"
                value={form.tags}
                onChange={event => setForm({ ...form, tags: event.target.value })}
              />
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">الصور والملفات</h2>
              <p className="admin-section-copy">يمكنك رفع أكثر من صورة وأكثر من ملف في نفس المنتج.</p>
            </div>

            <div className="admin-field">
              <label className="admin-label">صور المنتج</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={event => setImages(event.target.files)}
                className="admin-file-input"
              />
              <span className="admin-help">أول صورة ستظهر كمصغّرة في المتجر.</span>
              {images?.length ? (
                <div className="admin-file-list">
                  {Array.from(images).map((image, index) => (
                    <div key={index} className="admin-file-row">
                      <span className="admin-file-name">{image.name}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="admin-field">
              <label className="admin-label">ملفات المنتج</label>
              <input
                type="file"
                accept=".pdf,.mp4,.zip"
                multiple
                onChange={event => setFiles(event.target.files)}
                className="admin-file-input"
              />
              {files?.length ? (
                <div className="admin-file-list">
                  {Array.from(files).map((file, index) => (
                    <div key={index} className="admin-file-row">
                      <span className="admin-file-name">{file.name}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="admin-form-column">
          <section className="admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">التصنيف والتسعير</h2>
              <p className="admin-section-copy">حدد الفئة والمستوى وحالة الظهور قبل نشر المنتج.</p>
            </div>

            <div className="admin-field">
              <label className="admin-label">الفئة</label>
              <select
                className="admin-select"
                value={form.category_id}
                onChange={event => setForm({ ...form, category_id: event.target.value })}
              >
                <option value="">— بدون فئة —</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">المستوى</label>
              <select
                className="admin-select"
                value={form.level}
                onChange={event => setForm({ ...form, level: event.target.value })}
              >
                <option value="beginner">مبتدئ</option>
                <option value="intermediate">متوسط</option>
                <option value="all">الكل</option>
              </select>
            </div>

            <div className="admin-checkbox-panel">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={event => setForm({ ...form, is_free: event.target.checked })}
                />
                منتج مجاني
              </label>
              <span className="admin-help">عند تفعيله يصبح السعر صفرًا.</span>
            </div>

            <div className="admin-checkbox-panel">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={event => setForm({ ...form, is_active: event.target.checked })}
                />
                المنتج ظاهر في المتجر
              </label>
              <span className="admin-help">يمكنك حفظ المنتج كمخفي حتى يكتمل تجهيزه.</span>
            </div>

            {!form.is_free ? (
              <div className="admin-field">
                <label className="admin-label">السعر (ريال) *</label>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={event => setForm({ ...form, price: event.target.value })}
                />
              </div>
            ) : null}
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">الإجراء</h2>
              <p className="admin-section-copy">بعد الحفظ سيتم نقلك مباشرة إلى صفحة تعديل المنتج.</p>
            </div>

            <div className="admin-actions-row">
              <button type="submit" disabled={loading} className="admin-button" style={{ flex: 1 }}>
                {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
              </button>
              <Link href="/admin/products" className="admin-button-secondary">
                إلغاء
              </Link>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
