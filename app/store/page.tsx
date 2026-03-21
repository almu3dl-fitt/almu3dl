import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import AccountNavLink from '@/app/components/AccountNavLink'
import CartIcon from '@/app/components/CartIcon'
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

  const categories = (categoryData ?? []) as StoreCategory[]

  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (params.category) {
    const selectedCategory = categories.find(category => category.slug === params.category)
    if (selectedCategory) query = query.eq('category_id', selectedCategory.id)
  }

  if (params.level && ['beginner', 'intermediate', 'all'].includes(params.level)) {
    query = query.eq('level', params.level)
  }

  if (params.free === 'true') {
    query = query.eq('is_free', true)
  }

  const { data: productData } = await query
  const products = (productData ?? []) as StoreProduct[]
  const productImageUrls = await getProductImageUrls(products.map(product => product.slug))

  const activeFilterCount = [
    Boolean(params.category),
    Boolean(params.level),
    params.free === 'true',
  ].filter(Boolean).length

  return (
    <div className="store-page-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .store-page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 28%),
            #fafafa;
          color: #1a1a1a;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .store-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.85rem;
          padding: 0.82rem 1.2rem;
          border-bottom: 1px solid rgba(17, 17, 17, 0.07);
          background-color: rgba(250, 250, 250, 0.92);
          backdrop-filter: blur(14px);
        }

        .store-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
        }

        .store-brand img {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .store-brand span {
          font-size: 1.16rem;
          font-weight: 900;
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .store-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .store-nav-link {
          color: #555;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 600;
        }

        .store-nav-account {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0.6rem 0.9rem;
          border-radius: 12px;
          border: 1px solid #f0ddb0;
          background: #fff8e7;
          color: #8f6a14;
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 800;
        }

        .store-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1.25rem 1.15rem 3.5rem;
        }

        .store-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1rem;
          margin-bottom: 1.2rem;
        }

        .store-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.6rem;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          background: rgba(184, 145, 46, 0.12);
          color: #8f6a14;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .store-title {
          margin: 0 0 0.6rem;
          font-size: clamp(1.9rem, 4vw, 2.8rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .store-subtitle {
          max-width: 640px;
          margin: 0;
          color: #6f6f6f;
          font-size: 0.98rem;
          line-height: 1.7;
        }

        .store-hero-summary {
          min-width: 196px;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(184, 145, 46, 0.18);
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 16px 30px rgba(17, 17, 17, 0.04);
        }

        .store-hero-summary strong {
          display: block;
          margin-bottom: 0.3rem;
          color: #1a1a1a;
          font-size: 1.45rem;
          font-weight: 900;
        }

        .store-hero-summary span,
        .store-hero-summary p {
          margin: 0;
          color: #777;
          font-size: 0.9rem;
        }

        .store-filter-panel {
          display: grid;
          gap: 0.85rem;
          padding: 1rem;
          margin-bottom: 1.3rem;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 14px 30px rgba(17, 17, 17, 0.04);
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
          font-size: 0.98rem;
          font-weight: 800;
        }

        .store-filter-head p {
          margin: 0.2rem 0 0;
          color: #7b7b7b;
          font-size: 0.84rem;
        }

        .store-filter-status {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          background: #f7f7f7;
          color: #666;
          font-size: 0.76rem;
          font-weight: 700;
        }

        .store-filter-group {
          display: grid;
          gap: 0.5rem;
        }

        .store-filter-label {
          color: #6a6a6a;
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
          border: 1px solid #e7e7e7;
          border-radius: 999px;
          background: #fcfcfc;
          color: #555;
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 700;
          white-space: nowrap;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .store-filter-pill:hover {
          transform: translateY(-1px);
          border-color: #d3c18a;
          box-shadow: 0 10px 18px rgba(212, 168, 67, 0.12);
        }

        .store-filter-pill.is-active {
          border-color: transparent;
          background: linear-gradient(135deg, #1a1a1a, #383838);
          color: #fff;
        }

        .store-filter-pill.is-highlighted {
          color: #8f6a14;
          background: #fff8e7;
          border-color: #f0ddb0;
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
          font-size: 1.05rem;
          font-weight: 800;
        }

        .store-products-head p {
          margin: 0;
          color: #767676;
          font-size: 0.88rem;
        }

        .store-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.9rem;
        }

        .store-card {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          overflow: hidden;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 14px 30px rgba(17, 17, 17, 0.05);
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .store-card:hover {
          transform: translateY(-3px);
          border-color: rgba(184, 145, 46, 0.24);
          box-shadow: 0 18px 34px rgba(17, 17, 17, 0.08);
        }

        .store-card-visual {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          min-height: 80px;
          padding: 0.85rem 0.9rem 0.75rem;
          color: #fff;
        }

        .store-card-visual.has-image {
          min-height: 230px;
          padding: 0.78rem;
          background: #111 !important;
        }

        .store-card-visual::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 18px,
            rgba(255, 255, 255, 0.07) 18px,
            rgba(255, 255, 255, 0.07) 19px
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
          font-size: 1.7rem;
          line-height: 1;
        }

        .store-card-price-chip {
          padding: 0.3rem 0.6rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
          font-size: 0.74rem;
          font-weight: 800;
        }

        .store-card-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 0.7rem;
          padding: 0.9rem 0.9rem 1rem;
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
          background: #f5f5f5;
          color: #6a6a6a;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .store-card-meta .store-card-category {
          background: #fef7e5;
          color: #9f7414;
        }

        .store-card-title {
          margin: 0;
          color: #1a1a1a;
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.45;
        }

        .store-card-description {
          margin: 0;
          color: #8a8a8a;
          font-size: 0.84rem;
          line-height: 1.6;
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
          color: #9b9b9b;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .store-card-price {
          color: #b8912e;
          font-size: 1.18rem;
          font-weight: 900;
          line-height: 1;
        }

        .store-card-price.is-free {
          color: #16a34a;
        }

        .store-card-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0.72rem 1rem;
          border-radius: 14px;
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
          box-shadow: 0 12px 22px rgba(184, 145, 46, 0.22);
          font-size: 0.84rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .store-card-cta.is-free {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        .store-empty {
          padding: 3rem 1.5rem;
          border: 1px dashed #ddd;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.7);
          text-align: center;
          color: #8f8f8f;
          line-height: 1.8;
        }

        .store-footer {
          padding: 1.8rem 1.25rem;
          border-top: 1px solid #eee;
          background: #fff;
          color: #bbb;
          font-size: 0.8rem;
          text-align: center;
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
          .store-nav {
            gap: 0.6rem;
            padding: 0.72rem 0.9rem;
          }

          .store-brand img {
            width: 40px;
            height: 40px;
          }

          .store-brand span {
            font-size: 0.98rem;
          }

          .store-nav-actions {
            gap: 0.55rem;
          }

          .store-nav-link {
            font-size: 0.82rem;
          }

          .store-nav-account {
            min-height: 36px;
            padding: 0.5rem 0.78rem;
            font-size: 0.78rem;
          }

          .store-main {
            padding: 0.95rem 0.8rem 2.8rem;
          }

          .store-hero {
            gap: 0.8rem;
            margin-bottom: 1rem;
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
            padding: 0.85rem 0.8rem;
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
            min-height: 68px;
            padding: 0.72rem 0.78rem 0.65rem;
          }

          .store-card-visual.has-image {
            min-height: 200px;
            padding: 0.7rem;
          }

          .store-card-body {
            gap: 0.62rem;
            padding: 0.82rem 0.82rem 0.9rem;
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

      <nav className="store-nav">
        <Link href="/" className="store-brand">
          <Image src="/logo.png" alt="المعضل" width={48} height={48} />
          <span>المعضل</span>
        </Link>

        <div className="store-nav-actions">
          <CartIcon />
          <AccountNavLink className="store-nav-account" />
          <Link href="/" className="store-nav-link">
            الرئيسية
          </Link>
        </div>
      </nav>

      <main className="store-main">
        <section className="store-hero">
          <div>
            <span className="store-eyebrow">المتجر الرقمي</span>
            <h1 className="store-title">اختر البرنامج اللي يناسب هدفك</h1>
            <p className="store-subtitle">
              رتّبنا الأقسام والفلاتر بحيث يكون التصفح أسرع على الجوال، مع بطاقات
              أخف بصريًا وسعر أوضح من أول نظرة.
            </p>
          </div>

          <div className="store-hero-summary">
            <strong>{products.length}</strong>
            <span>برنامج ظاهر حسب الفلاتر الحالية</span>
            <p>{activeFilterCount > 0 ? `${activeFilterCount} فلتر مفعّل الآن` : 'بدون أي فلترة إضافية'}</p>
          </div>
        </section>

        <section className="store-filter-panel">
          <div className="store-filter-head">
            <div>
              <h2>فلترة أسرع</h2>
              <p>الفئة، المستوى، والبرامج المجانية كلها صارت أوضح وأسهل على الموبايل.</p>
            </div>
            <span className="store-filter-status">
              {activeFilterCount > 0 ? `${activeFilterCount} مفعّل` : 'كل البرامج'}
            </span>
          </div>

          <div className="store-filter-group">
            <span className="store-filter-label">الفئة</span>
            <div className="store-filter-row">
              <Link
                href={buildStoreHref(params, { category: undefined })}
                className={`store-filter-pill ${!params.category ? 'is-active' : ''}`}
              >
                الكل
              </Link>
              {categories.map(category => (
                <Link
                  key={category.id}
                  href={buildStoreHref(params, { category: category.slug })}
                  className={`store-filter-pill ${params.category === category.slug ? 'is-active' : ''}`}
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
                href={buildStoreHref(params, { level: undefined })}
                className={`store-filter-pill ${!params.level ? 'is-active' : ''}`}
              >
                كل المستويات
              </Link>
              {Object.entries(levelLabels).map(([value, label]) => (
                <Link
                  key={value}
                  href={buildStoreHref(params, { level: value })}
                  className={`store-filter-pill ${params.level === value ? 'is-active' : ''}`}
                >
                  {label}
                </Link>
              ))}
              <Link
                href={buildStoreHref(params, { free: params.free === 'true' ? undefined : 'true' })}
                className={`store-filter-pill is-highlighted ${params.free === 'true' ? 'is-active' : ''}`}
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
              <p>بطاقات أقصر، معلومات أهم، وخطوة أوضح للوصول إلى صفحة المنتج.</p>
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
                const productImageUrl = productImageUrls.get(product.slug) ?? null

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
                          {product.is_free ? 'حمّل الآن' : 'عرض التفاصيل'}
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

      <footer className="store-footer">
        <p>© {new Date().getFullYear()} المعضل — Almu3dl. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  )
}
