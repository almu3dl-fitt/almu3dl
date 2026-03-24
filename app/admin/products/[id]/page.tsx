'use client'

import { use, useEffect, useEffectEvent, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminPageHeader from '@/app/admin/components/AdminPageHeader'

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
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائيًا؟')) return
    if (!confirm('الحذف نهائي ولا يمكن التراجع. هل تريد المتابعة؟')) return

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
      <div className="admin-page">
        <div className="admin-empty">جاري تحميل بيانات المنتج...</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="تعديل المنتج"
        title={form.title || 'تعديل المنتج'}
        description="عدّل البيانات الأساسية أو الملفات أو الصور من نفس الصفحة، مع إبقاء حالة الظهور والسعر تحت سيطرتك."
        backHref="/admin/products"
        backLabel="الرجوع للمنتجات"
      />

      {notice ? <div className={`admin-notice is-${notice.type}`}>{notice.text}</div> : null}

      <form onSubmit={handleSave} className="admin-form-grid">
        <div className="admin-form-column">
          <section className="admin-section-card">
            <div className="admin-checkbox-panel">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={event => setForm({ ...form, is_active: event.target.checked })}
                />
                {form.is_active ? 'المنتج ظاهر حاليًا في المتجر' : 'المنتج مخفي حاليًا من المتجر'}
              </label>
              <span className="admin-help">
                {form.is_active ? 'يمكن للعميل الوصول إليه والشراء.' : 'لن يظهر في واجهة المتجر.'}
              </span>
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
              <label className="admin-label">الرابط المخصص</label>
              <input
                className="admin-input is-ltr"
                value={form.slug}
                onChange={event => setForm({ ...form, slug: event.target.value })}
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
              <label className="admin-label">التاقات</label>
              <input
                className="admin-input"
                placeholder="غذاء, تنحيف, مبتدئ"
                value={form.tags}
                onChange={event => setForm({ ...form, tags: event.target.value })}
              />
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">صور المنتج</h2>
              <p className="admin-section-copy">تحكم بالصورة المصغرة والصور الإضافية من مكان واحد.</p>
            </div>

            {images.length === 0 ? (
              <div className="admin-empty">لا توجد صور مضافة لهذا المنتج.</div>
            ) : (
              <div className="admin-media-grid">
                {images.map((image, index) => (
                  <div key={image.path} className="admin-media-card">
                    <div className="admin-media-preview">
                      <Image
                        src={image.url}
                        alt={`صورة ${index + 1} للمنتج`}
                        fill
                        sizes="180px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>

                    <div className="admin-media-body">
                      <span className="admin-file-name">
                        {index === 0 ? 'الصورة المصغّرة الحالية' : `صورة إضافية ${index + 1}`}
                      </span>

                      {image.isLegacy ? (
                        <div className="admin-help">
                          هذه صورة افتراضية مرتبطة بالواجهة، ويمكن استبدالها برفع صورة جديدة.
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="admin-button-danger"
                          onClick={() => handleDeleteImage(image.path)}
                        >
                          حذف الصورة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-field">
              <label className="admin-label">إضافة صور جديدة</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={event => setNewImages(event.target.files)}
                className="admin-file-input"
              />
              {newImages?.length ? (
                <div className="admin-file-list">
                  {Array.from(newImages).map((image, index) => (
                    <div key={index} className="admin-file-row">
                      <span className="admin-file-name">{image.name}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <h2 className="admin-section-title">ملفات المنتج</h2>
              <p className="admin-section-copy">حذف الملفات القديمة أو إضافة ملفات جديدة للعميل.</p>
            </div>

            {files.length === 0 ? (
              <div className="admin-empty">لا توجد ملفات مرفقة بهذا المنتج.</div>
            ) : (
              <div className="admin-file-list">
                {files.map(file => (
                  <div key={file.id} className="admin-file-row">
                    <span className="admin-file-name">{file.file_name}</span>
                    <button
                      type="button"
                      className="admin-button-danger"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-field">
              <label className="admin-label">إضافة ملفات جديدة</label>
              <input
                type="file"
                accept=".pdf,.mp4,.zip"
                multiple
                onChange={event => setNewFiles(event.target.files)}
                className="admin-file-input"
              />
              {newFiles?.length ? (
                <div className="admin-file-list">
                  {Array.from(newFiles).map((file, index) => (
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
              <p className="admin-section-copy">حدّث الفئة والمستوى والسعر وحالة المجانية.</p>
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
              <span className="admin-help">إذا كان مجانيًا فلن يُحتسب عليه سعر.</span>
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
              <h2 className="admin-section-title">إجراءات المنتج</h2>
              <p className="admin-section-copy">احفظ التغييرات أو احذف المنتج إذا لم تعد تحتاجه.</p>
            </div>

            <div className="admin-actions-row">
              <button type="submit" disabled={saving} className="admin-button" style={{ flex: 1 }}>
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>

            <div className="admin-actions-row">
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="admin-button-danger"
              >
                {deleting ? 'جاري الحذف...' : 'حذف المنتج'}
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
