import Link from 'next/link'
import AdminPageHeader from '@/app/admin/components/AdminPageHeader'
import AdminStatCard from '@/app/admin/components/AdminStatCard'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type AdminProductsSearchParams = {
  q?: string
  status?: string
  level?: string
  pricing?: string
  category?: string
}

type AdminProduct = {
  id: string
  title: string
  slug: string | null
  price: number | null
  is_free: boolean | null
  is_active: boolean | null
  level: string | null
  created_at: string
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null
}

type AdminCategory = {
  id: string
  name: string
  slug: string
}

function normalizeCategory(
  value: { name: string; slug: string } | { name: string; slug: string }[] | null,
) {
  return Array.isArray(value) ? value[0] : value
}

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  all: 'الكل',
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<AdminProductsSearchParams> | AdminProductsSearchParams
}) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const statusFilter = ['all', 'active', 'hidden'].includes(params.status ?? '')
    ? params.status ?? 'all'
    : 'all'
  const levelFilter = ['all-levels', 'beginner', 'intermediate', 'all'].includes(params.level ?? '')
    ? params.level ?? 'all-levels'
    : 'all-levels'
  const pricingFilter = ['all-pricing', 'free', 'paid'].includes(params.pricing ?? '')
    ? params.pricing ?? 'all-pricing'
    : 'all-pricing'

  const [{ data: productData }, { data: categoryData }] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, title, slug, price, is_free, is_active, level, created_at, categories(name, slug)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('categories').select('id, name, slug').order('name'),
  ])

  const products = (productData ?? []) as AdminProduct[]
  const categories = (categoryData ?? []) as AdminCategory[]
  const categoryFilter = categories.some(category => category.slug === params.category)
    ? params.category ?? 'all-categories'
    : 'all-categories'

  const filteredProducts = products.filter(product => {
    const category = normalizeCategory(product.categories)
    const matchesQuery = query
      ? [product.title, product.slug ?? '', category?.name ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      : true

    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'active'
        ? product.is_active === true
        : product.is_active !== true

    const matchesLevel = levelFilter === 'all-levels' ? true : product.level === levelFilter
    const matchesPricing = pricingFilter === 'all-pricing'
      ? true
      : pricingFilter === 'free'
        ? product.is_free === true
        : product.is_free !== true
    const matchesCategory = categoryFilter === 'all-categories'
      ? true
      : category?.slug === categoryFilter

    return matchesQuery && matchesStatus && matchesLevel && matchesPricing && matchesCategory
  })

  const activeCount = products.filter(product => product.is_active).length
  const hiddenCount = products.filter(product => !product.is_active).length
  const freeCount = products.filter(product => product.is_free).length

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="إدارة المنتجات"
        title="المنتجات"
        description="قائمة مرتبة ببحث وفلاتر واضحة حتى تصل سريعًا للمنتج الذي تريد تعديله بدل استعراض قائمة طويلة بشكل مرهق."
        actions={
          <Link href="/admin/products/new" className="admin-button">
            إضافة منتج جديد
          </Link>
        }
      />

      <div className="admin-stats-grid">
        <AdminStatCard
          label="كل المنتجات"
          value={String(products.length)}
          helper="العدد الكامل داخل قاعدة المتجر."
          tone="accent"
        />
        <AdminStatCard
          label="نشط في المتجر"
          value={String(activeCount)}
          helper="ظاهر للعميل ويمكن شراؤه."
          tone="success"
        />
        <AdminStatCard
          label="مخفي حاليًا"
          value={String(hiddenCount)}
          helper="موجود لكنه غير ظاهر في واجهة المتجر."
          tone="warning"
        />
        <AdminStatCard
          label="منتجات مجانية"
          value={String(freeCount)}
          helper="تفيد للعروض أو المحتوى المجاني."
          tone="default"
        />
      </div>

      <form className="admin-toolbar" method="get">
        <div className="admin-toolbar-grid">
          <div className="admin-field">
            <label htmlFor="products-q" className="admin-label">بحث بالاسم أو الرابط</label>
            <input
              id="products-q"
              name="q"
              defaultValue={query}
              className="admin-input"
              placeholder="ابحث عن منتج محدد"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="products-status" className="admin-label">الحالة</label>
            <select id="products-status" name="status" defaultValue={statusFilter} className="admin-select">
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="hidden">مخفي</option>
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="products-level" className="admin-label">المستوى</label>
            <select id="products-level" name="level" defaultValue={levelFilter} className="admin-select">
              <option value="all-levels">كل المستويات</option>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="all">الكل</option>
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="products-pricing" className="admin-label">السعر</label>
            <select id="products-pricing" name="pricing" defaultValue={pricingFilter} className="admin-select">
              <option value="all-pricing">الكل</option>
              <option value="paid">مدفوع</option>
              <option value="free">مجاني</option>
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="products-category" className="admin-label">الفئة</label>
            <select id="products-category" name="category" defaultValue={categoryFilter} className="admin-select">
              <option value="all-categories">كل الفئات</option>
              {categories.map(category => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-toolbar-actions">
          <button type="submit" className="admin-button">عرض النتائج</button>
          <Link href="/admin/products" className="admin-button-secondary">إعادة الضبط</Link>
          <span className="admin-help">
            النتيجة الحالية: {filteredProducts.length} من أصل {products.length} منتج.
          </span>
        </div>
      </form>

      {filteredProducts.length === 0 ? (
        <div className="admin-empty">
          لا توجد منتجات مطابقة لهذه الفلاتر. غيّر البحث أو أزل التصفية لعرض القائمة كاملة.
        </div>
      ) : (
        <div className="admin-product-list">
          {filteredProducts.map(product => {
            const category = normalizeCategory(product.categories)

            return (
              <article key={product.id} className="admin-product-card">
                <div className="admin-card-head">
                  <div>
                    <h2 className="admin-card-title">{product.title}</h2>
                    <p className="admin-card-subtitle">
                      {product.slug ? `/${product.slug}` : 'بدون رابط مخصص'} •{' '}
                      {new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(
                        new Date(product.created_at),
                      )}
                    </p>
                  </div>

                  <div className="admin-card-meta">
                    <span className={`admin-status-badge ${product.is_active ? 'is-success' : 'is-muted'}`}>
                      {product.is_active ? 'نشط' : 'مخفي'}
                    </span>
                    <span className={`admin-status-badge ${product.is_free ? 'is-warning' : 'is-accent'}`}>
                      {product.is_free ? 'مجاني' : `${product.price ?? 0} ريال`}
                    </span>
                  </div>
                </div>

                <div className="admin-tag-list">
                  <span className="admin-tag">المستوى: {levelLabels[product.level ?? 'all'] || 'غير محدد'}</span>
                  <span className="admin-tag">الفئة: {category?.name || 'بدون فئة'}</span>
                </div>

                <div className="admin-product-actions">
                  <Link href={`/admin/products/${product.id}`} className="admin-button">
                    تعديل المنتج
                  </Link>
                  {product.slug ? (
                    <Link href={`/store/${product.slug}`} target="_blank" className="admin-button-secondary">
                      فتح صفحة المنتج
                    </Link>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
