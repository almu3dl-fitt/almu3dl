import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'
import { getProductImageUrls } from '@/lib/product-images'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/site'

type StoreSearchParams = {
  category?: string
  level?: string
  free?: string
}

type StoreCategory = {
  id: string
  name: string
  slug: string
}

type StoreProduct = {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  is_free: boolean
  level: string
  categories: { name: string; slug: string } | null
}

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  all: 'يناسب الجميع',
}

const categoryThemes: Record<string, { icon: string; gradient: string }> = {
  nutrition: {
    icon: '🥗',
    gradient: 'linear-gradient(135deg, #D4A843, #B8912E)',
  },
  workouts: {
    icon: '🏋🏻',
    gradient: 'linear-gradient(135deg, #1a1a1a, #3a3a3a)',
  },
  therapy: {
    icon: '🩺',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  bundles: {
    icon: '📦',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  },
}

export const metadata: Metadata = {
  title: 'المتجر',
  description:
    'تصفّح برامج التغذية والتمارين والباقات الرقمية في متجر المعضل مع فلترة سريعة وتجربة شراء عربية واضحة.',
  alternates: {
    canonical: '/store',
  },
  openGraph: {
    title: `المتجر | ${siteConfig.name}`,
    description:
      'برامج رقمية مرتبة حسب الفئة والمستوى مع تصفح سريع على الجوال وخطوات شراء مباشرة.',
    url: '/store',
  },
}

function buildStoreHref(
  current: StoreSearchParams,
  updates: Partial<StoreSearchParams>,
) {
  const merged = { ...current, ...updates }
  const query = new URLSearchParams()

  if (merged.category) query.set('category', merged.category)
  if (merged.level) query.set('level', merged.level)
  if (merged.free === 'true') query.set('free', 'true')

  const search = query.toString()
  return search ? `/store?${search}` : '/store'
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<StoreSearchParams> | StoreSearchParams
}) {
  const params = await searchParams

  const { data: categoryData } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const categories = ((categoryData ?? []) as StoreCategory[]).filter(
    category => category.slug !== 'bundles',
  )
  const normalizedParams: StoreSearchParams = {
    category: categories.some(category => category.slug === params.category)
      ? params.category
      : undefined,
    level: ['beginner', 'intermediate', 'all'].includes(params.level ?? '')
      ? params.level
      : undefined,
    free: params.free === 'true' ? 'true' : undefined,
  }

  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (normalizedParams.category) {
    const selectedCategory = categories.find(category => category.slug === normalizedParams.category)
    if (selectedCategory) query = query.eq('category_id', selectedCategory.id)
  }

  if (normalizedParams.level) {
    query = query.eq('level', normalizedParams.level)
  }

  if (normalizedParams.free === 'true') {
    query = query.eq('is_free', true)
  }

  const { data: productData } = await query
  const products = ((productData ?? []) as StoreProduct[]).filter(
    product => product.categories?.slug !== 'bundles',
  )
  const productImageUrls = await getProductImageUrls(
    products.map(product => ({
      id: product.id,
      slug: product.slug,
    })),
  )

  const activeFilterCount = [
    Boolean(normalizedParams.category),
    Boolean(normalizedParams.level),
    normalizedParams.free === 'true',
  ].filter(Boolean).length

  return (
    <div className="store-page-shell storefront-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .store-page-shell {
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .store-main {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1.4rem 0 0;
        }

        .store-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1rem;
          margin-bottom: 1.2rem;
          padding: 1.5rem;
          border: 1px solid var(--store-border);
          border-radius: var(--store-radius-xl);
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.12), rgba(255, 255, 255, 0.02) 42%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-shadow);
          position: relative;
          overflow: hidden;
        }

        .store-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), transparent 88%);
          pointer-events: none;
        }

        .store-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.8rem;
          padding: 0.35rem 0.82rem;
          border-radius: 999px;
          border: 1px solid var(--store-border-strong);
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.76rem;
          font-weight: 800;
        }

        .store-title {
          margin: 0 0 0.6rem;
          color: var(--store-text);
          font-size: clamp(2rem, 4vw, 3.3rem);
          font-weight: 900;
          line-height: 1.15;
        }

        .store-subtitle {
          max-width: 640px;
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.98rem;
          line-height: 1.9;
        }

        .store-hero-summary {
          min-width: 196px;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.04);
        }

        .store-hero-summary strong {
          display: block;
          margin-bottom: 0.3rem;
          color: var(--store-accent-strong);
          font-size: 1.7rem;
          font-weight: 900;
        }

        .store-hero-summary span,
        .store-hero-summary p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.88rem;
        }

        .store-filter-panel {
          display: grid;
          gap: 0.85rem;
          padding: 1.15rem;
          margin-bottom: 1.3rem;
          border: 1px solid var(--store-border);
          border-radius: var(--store-radius-lg);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            rgba(255, 255, 255, 0.02);
          box-shadow: var(--store-card-shadow);
        }

        .store-filter-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .store-filter-head h2 {
          margin: 0;
          color: var(--store-text);
          font-size: 1rem;
          font-weight: 800;
        }

        .store-filter-head p {
          margin: 0.2rem 0 0;
          color: var(--store-text-soft);
          font-size: 0.84rem;
        }

        .store-filter-status {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          border: 1px solid var(--store-border);
          background: rgba(255, 255, 255, 0.04);
          color: var(--store-text-muted);
          font-size: 0.76rem;
          font-weight: 700;
        }

        .store-filter-group {
          display: grid;
          gap: 0.5rem;
        }

        .store-filter-label {
          color: var(--store-text-soft);
          font-size: 0.78rem;
          font-weight: 800;
        }

        .store-filter-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .store-filter-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0.52rem 0.88rem;
          border: 1px solid var(--store-border);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.03);
          color: var(--store-text-muted);
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 700;
          white-space: nowrap;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .store-filter-pill:hover {
          transform: translateY(-1px);
          border-color: var(--store-border-strong);
          box-shadow: 0 10px 18px rgba(224, 180, 72, 0.12);
        }

        .store-filter-pill.is-active {
          border-color: transparent;
          background: linear-gradient(135deg, #fff0bf, var(--store-accent));
          color: #111;
        }

        .store-filter-pill.is-highlighted {
          color: var(--store-accent-strong);
          background: var(--store-accent-wash);
          border-color: var(--store-border-strong);
        }

        .store-products-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.9rem;
          flex-wrap: wrap;
        }

        .store-products-head h3 {
          margin: 0;
          color: var(--store-text);
          font-size: 1.14rem;
          font-weight: 800;
        }

        .store-products-head p {
          margin: 0;
          color: var(--store-text-soft);
          font-size: 0.88rem;
        }

        .store-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }

        .store-card {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          overflow: hidden;
          border: 1px solid var(--store-border);
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .store-card:hover {
          transform: translateY(-3px);
          border-color: var(--store-border-strong);
          box-shadow: 0 22px 38px rgba(0, 0, 0, 0.35);
        }

        .store-card-visual {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          min-height: 92px;
          padding: 1rem 1rem 0.85rem;
          color: #fff;
        }

        .store-card-visual.has-image {
          min-height: 260px;
          padding: 0.85rem;
          background: #090909 !important;
        }

        .store-card-visual::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 18px,
            rgba(255, 255, 255, 0.06) 18px,
            rgba(255, 255, 255, 0.06) 19px
          );
          pointer-events: none;
        }

        .store-card-visual.has-image::after {
          background:
            linear-gradient(180deg, rgba(17, 17, 17, 0.06), rgba(17, 17, 17, 0.46));
        }

        .store-card-image {
          object-fit: cover;
        }

        .store-card-icon,
        .store-card-price-chip {
          position: relative;
          z-index: 1;
        }

        .store-card-icon {
          font-size: 2rem;
          line-height: 1;
        }

        .store-card-price-chip {
          padding: 0.36rem 0.68rem;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 0.72rem;
          font-weight: 800;
        }

        .store-card-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 0.76rem;
          padding: 1rem;
        }

        .store-card-meta {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .store-card-meta span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 24px;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--store-text-soft);
          font-size: 0.7rem;
          font-weight: 800;
        }

        .store-card-meta .store-card-category {
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
        }

        .store-card-title {
          margin: 0;
          color: var(--store-text);
          font-size: 1.04rem;
          font-weight: 800;
          line-height: 1.45;
        }

        .store-card-description {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.84rem;
          line-height: 1.75;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }

        .store-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.8rem;
          margin-top: auto;
          padding-top: 0.15rem;
        }

        .store-card-price-label {
          display: block;
          margin-bottom: 0.2rem;
          color: var(--store-text-soft);
          font-size: 0.74rem;
          font-weight: 700;
        }

        .store-card-price {
          color: var(--store-accent-strong);
          font-size: 1.22rem;
          font-weight: 900;
          line-height: 1;
        }

        .store-card-price.is-free {
          color: #7ce6a5;
        }

        .store-card-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0.72rem 1.05rem;
          border-radius: 14px;
          background: linear-gradient(135deg, #fff0bf, var(--store-accent));
          color: #111;
          box-shadow: 0 12px 22px rgba(224, 180, 72, 0.18);
          font-size: 0.84rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .store-card-cta.is-free {
          background: linear-gradient(135deg, #86efac, #3dc26c);
        }

        .store-empty {
          padding: 3rem 1.5rem;
          border: 1px dashed var(--store-border-strong);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          text-align: center;
          color: var(--store-text-muted);
          line-height: 1.8;
        }

        @media (max-width: 820px) {
          .store-hero {
            align-items: stretch;
            flex-direction: column;
          }

          .store-hero-summary {
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .store-main {
            width: min(calc(100% - 1rem), var(--store-content-width));
            padding-top: 1rem;
          }

          .store-hero {
            gap: 0.8rem;
            margin-bottom: 1rem;
            padding: 1rem;
          }

          .store-title {
            font-size: 1.62rem;
          }

          .store-subtitle {
            font-size: 0.9rem;
          }

          .store-hero-summary {
            padding: 0.82rem 0.9rem;
          }

          .store-hero-summary strong {
            font-size: 1.28rem;
          }

          .store-filter-panel {
            gap: 0.7rem;
            padding: 0.95rem 0.85rem;
            border-radius: 16px;
          }

          .store-filter-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 0.15rem;
            scrollbar-width: none;
          }

          .store-filter-row::-webkit-scrollbar {
            display: none;
          }

          .store-filter-pill {
            flex: 0 0 auto;
          }

          .store-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .store-card-visual {
            min-height: 78px;
            padding: 0.82rem 0.85rem 0.72rem;
          }

          .store-card-visual.has-image {
            min-height: 220px;
            padding: 0.78rem;
          }

          .store-card-body {
            gap: 0.62rem;
            padding: 0.9rem 0.9rem 1rem;
          }

          .store-card-footer {
            align-items: center;
          }

          .store-card-price {
            font-size: 1.1rem;
          }

          .store-card-cta {
            min-width: 108px;
            padding-inline: 0.8rem;
          }
        }
      `}</style>

      <StorefrontHeader
        actions={[
          { href: '/calorie-calculator', label: 'حاسبة السعرات', variant: 'muted' },
          { href: '/store?free=true', label: 'العروض المجانية', variant: 'primary' },
        ]}
      />

      <main className="store-main">
        <section className="store-hero">
          <div>
            <span className="store-eyebrow">المتجر الرقمي</span>
            <h1 className="store-title">اختَر البرنامج الذي يترجم هدفك إلى بداية فعلية</h1>
            <p className="store-subtitle">
              تصفح برامج التغذية والتمارين والتأهيل والباقات، واستخدم الفلاتر
              للوصول بسرعة إلى ما يناسب هدفك.
            </p>
          </div>

          <div className="store-hero-summary">
            <strong>{products.length}</strong>
            <span>برنامج ظاهر حسب الفلاتر الحالية</span>
            <p>
              {activeFilterCount > 0
                ? `${activeFilterCount} فلتر مفعّل الآن`
                : 'تصفح كامل للمتجر بدون قيود'}
            </p>
          </div>
        </section>

        <section className="store-filter-panel">
          <div className="store-filter-head">
            <div>
              <h2>فلترة أسرع وأكثر وضوحًا</h2>
              <p>حدّد الفئة والمستوى والبرامج المجانية ضمن شريط واضح ومهيأ للمس.</p>
            </div>
            <span className="store-filter-status">
              {activeFilterCount > 0 ? `${activeFilterCount} مفعّل` : 'كل البرامج'}
            </span>
          </div>

          <div className="store-filter-group">
            <span className="store-filter-label">الفئة</span>
            <div className="store-filter-row">
              <Link
                href={buildStoreHref(normalizedParams, { category: undefined })}
                className={`store-filter-pill ${!normalizedParams.category ? 'is-active' : ''}`}
              >
                الكل
              </Link>
              {categories.map(category => (
                <Link
                  key={category.id}
                  href={buildStoreHref(normalizedParams, { category: category.slug })}
                  className={`store-filter-pill ${normalizedParams.category === category.slug ? 'is-active' : ''}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="store-filter-group">
            <span className="store-filter-label">المستوى ونوع العرض</span>
            <div className="store-filter-row">
              <Link
                href={buildStoreHref(normalizedParams, { level: undefined })}
                className={`store-filter-pill ${!normalizedParams.level ? 'is-active' : ''}`}
              >
                كل المستويات
              </Link>
              {Object.entries(levelLabels).map(([value, label]) => (
                <Link
                  key={value}
                  href={buildStoreHref(normalizedParams, { level: value })}
                  className={`store-filter-pill ${normalizedParams.level === value ? 'is-active' : ''}`}
                >
                  {label}
                </Link>
              ))}
              <Link
                href={buildStoreHref(normalizedParams, {
                  free: normalizedParams.free === 'true' ? undefined : 'true',
                })}
                className={`store-filter-pill is-highlighted ${normalizedParams.free === 'true' ? 'is-active' : ''}`}
              >
                مجانية فقط
              </Link>
            </div>
          </div>
        </section>

        <section>
            <div className="store-products-head">
              <div>
                <h3>البرامج المتاحة</h3>
                <p>اختر من البرامج المتاحة حسب هدفك والمستوى المناسب لك.</p>
              </div>
              <p>{products.length} نتيجة</p>
            </div>

          {products.length === 0 ? (
            <div className="store-empty">
              لا توجد منتجات بهذه التصفية الآن.
              <br />
              جرّب إزالة بعض الفلاتر أو العودة لكل البرامج.
            </div>
          ) : (
            <div className="store-grid">
              {products.map(product => {
                const theme = product.is_free
                  ? {
                      icon: '🎁',
                      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    }
                  : categoryThemes[product.categories?.slug ?? 'bundles'] ?? categoryThemes.bundles
                const productImageUrl = productImageUrls.get(product.id) ?? null

                return (
                  <Link key={product.id} href={`/store/${product.slug}`} className="store-card">
                    <div
                      className={`store-card-visual ${productImageUrl ? 'has-image' : ''}`}
                      style={{ background: theme.gradient }}
                    >
                      {productImageUrl ? (
                        <Image
                          src={productImageUrl}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1120px) 50vw, 33vw"
                          className="store-card-image"
                        />
                      ) : (
                        <span className="store-card-icon">{theme.icon}</span>
                      )}
                      <span className="store-card-price-chip">
                        {product.is_free ? 'مجاني' : 'وصول فوري'}
                      </span>
                    </div>

                    <div className="store-card-body">
                      <div className="store-card-meta">
                        <span className="store-card-category">
                          {product.categories?.name ?? 'برنامج رقمي'}
                        </span>
                        <span>{levelLabels[product.level] ?? product.level}</span>
                      </div>

                      <h2 className="store-card-title">{product.title}</h2>

                      <p className="store-card-description">
                        {product.description || 'برنامج رقمي جاهز للتحميل مع شرح واضح وخطوات مباشرة للبدء.'}
                      </p>

                      <div className="store-card-footer">
                        <div>
                          <span className="store-card-price-label">
                            {product.is_free ? 'وصول فوري' : 'السعر'}
                          </span>
                          <span
                            className={`store-card-price ${product.is_free ? 'is-free' : ''}`}
                          >
                            {product.is_free ? 'مجاني' : `${product.price} ريال`}
                          </span>
                        </div>

                        <span className={`store-card-cta ${product.is_free ? 'is-free' : ''}`}>
                          {product.is_free ? 'ابدأ اليوم' : 'اكتشف الآن'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <StorefrontFooter note="تصفح البرامج واختر ما يناسب هدفك وميزانيتك." />
    </div>
  )
}
