import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import AddToCartButton from '@/app/components/AddToCartButton'
import ProductReviewForm from '@/app/components/ProductReviewForm'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'
import { getCustomerUser } from '@/lib/account-auth'
import { getApprovedProductReviews, getProductReviewAccess } from '@/lib/customer-reviews'
import { getProductImages } from '@/lib/product-images'
import { supabase } from '@/lib/supabase'
import { siteConfig, truncateText } from '@/lib/site'

type ProductPageParams = {
  slug: string
}

type Product = {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  is_free: boolean
  level: string
  tags: string[] | null
  categories: { name: string; slug: string } | null
}

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  all: 'يناسب الجميع',
}

const categoryThemes: Record<
  string,
  { icon: string; gradient: string; accent: string; surface: string }
> = {
  nutrition: {
    icon: '🥗',
    gradient: 'linear-gradient(135deg, #e0b448, #6e4f12)',
    accent: '#e0b448',
    surface: 'rgba(224, 180, 72, 0.14)',
  },
  workouts: {
    icon: '🏋🏻',
    gradient: 'linear-gradient(135deg, #0b0d0b, #272b27)',
    accent: '#f5cf66',
    surface: 'rgba(255, 255, 255, 0.05)',
  },
  therapy: {
    icon: '🩺',
    gradient: 'linear-gradient(135deg, #1c2427, #435056)',
    accent: '#d8c17a',
    surface: 'rgba(216, 193, 122, 0.12)',
  },
  bundles: {
    icon: '📦',
    gradient: 'linear-gradient(135deg, #17130a, #6a4c0f)',
    accent: '#f0c45a',
    surface: 'rgba(240, 196, 90, 0.14)',
  },
}

const getProductBySlug = cache(async (slug: string) => {
  const { data } = await supabase
    .from('products')
    .select('id, slug, title, description, price, is_free, level, tags, categories(name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return (data as Product | null) ?? null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: 'المنتج غير موجود',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const categoryName = product.categories?.name ?? 'برنامج رقمي'
  const description = truncateText(
    product.description?.trim() ||
      `${product.title} من ${siteConfig.name} برنامج رقمي عربي مع وصول فوري وتجربة شراء واضحة على الجوال.`,
    160,
  )

  return {
    title: product.title,
    description,
    alternates: {
      canonical: `/store/${slug}`,
    },
    openGraph: {
      title: `${product.title} | ${siteConfig.name}`,
      description,
      url: `/store/${slug}`,
      type: 'article',
      locale: 'ar_SA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | ${siteConfig.name}`,
      description,
    },
    keywords: [
      product.title,
      categoryName,
      levelLabels[product.level] ?? product.level,
      ...(product.tags ?? []),
      siteConfig.name,
    ],
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<ProductPageParams>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) return notFound()

  const theme = product.is_free
    ? {
        icon: '🎁',
        gradient: 'linear-gradient(135deg, #193922, #3dc26c)',
        accent: '#7ce6a5',
        surface: 'rgba(61, 194, 108, 0.14)',
      }
    : categoryThemes[product.categories?.slug ?? 'bundles'] ?? categoryThemes.bundles

  const categoryName = product.categories?.name ?? 'برنامج رقمي'
  const categorySlug = product.categories?.slug
  const productDescription =
    product.description?.trim() ||
    'برنامج رقمي جاهز يقدّم لك خطوات واضحة، تنظيم أفضل، ووصول سريع بعد الإتمام.'
  const descriptionBlocks = productDescription
    .split(/\n+/)
    .map(block => block.trim())
    .filter(Boolean)
  const customerUser = await getCustomerUser()
  const reviewSummary = await getApprovedProductReviews(product.id)
  const reviewAccess = customerUser?.email
    ? await getProductReviewAccess(product.id, customerUser.email)
    : null
  const productImages = await getProductImages(product.id, product.slug)
  const productImageUrl = productImages[0]?.url ?? null

  const trustItems = [
    { icon: '⚡', title: 'وصول فوري', text: 'تنتقل مباشرة إلى السلة ثم صفحة الإتمام بدون خطوات إضافية.' },
    {
      icon: '📩',
      title: 'تأكيد واضح',
      text: 'الفاتورة وروابط الوصول ترسل إلى البريد الإلكتروني بعد نجاح الطلب.',
    },
    {
      icon: '📱',
      title: 'جاهز على الجوال',
      text: 'يمكنك شراء البرنامج والوصول إليه بسهولة من الجوال أو الكمبيوتر.',
    },
  ]

  return (
    <div className="product-page-shell storefront-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .product-page-shell {
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .product-main {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1.4rem 0 0;
        }

        .product-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 1rem;
          color: var(--store-text-soft);
          font-size: 0.82rem;
          font-weight: 700;
          flex-wrap: wrap;
        }

        .product-breadcrumbs a {
          color: var(--store-accent-strong);
          text-decoration: none;
        }

        .product-overview {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(290px, 0.95fr);
          gap: 1rem;
          align-items: start;
        }

        .product-content {
          display: grid;
          gap: 1rem;
        }

        .product-hero-card,
        .product-detail-card,
        .product-purchase-card {
          border: 1px solid var(--store-border);
          border-radius: 26px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
        }

        .product-hero-card {
          overflow: hidden;
        }

        .product-visual {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          min-height: 240px;
          padding: 1.35rem;
          color: #fff;
        }

        .product-visual.has-image {
          align-items: flex-start;
          justify-content: flex-end;
          min-height: 460px;
          padding: 1rem;
          background: #080908 !important;
        }

        .product-visual::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 22px,
            rgba(255, 255, 255, 0.06) 22px,
            rgba(255, 255, 255, 0.06) 23px
          );
          pointer-events: none;
        }

        .product-visual.has-image::after {
          background:
            linear-gradient(180deg, rgba(17, 17, 17, 0.08), rgba(17, 17, 17, 0.5));
        }

        .product-hero-image {
          object-fit: cover;
        }

        .product-visual-icon,
        .product-visual-chip {
          position: relative;
          z-index: 1;
        }

        .product-visual-icon {
          font-size: 4.3rem;
          line-height: 1;
        }

        .product-visual-chip {
          padding: 0.5rem 0.82rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(17, 17, 17, 0.38);
          font-size: 0.78rem;
          font-weight: 800;
        }

        .product-copy {
          display: grid;
          gap: 0.9rem;
          padding: 1.35rem;
        }

        .product-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          padding: 0 1.35rem 1.35rem;
        }

        .product-gallery-item {
          position: relative;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid var(--store-border);
          background: rgba(255, 255, 255, 0.03);
        }

        .product-gallery-item img {
          object-fit: cover;
        }

        .product-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          padding: 0.34rem 0.78rem;
          border-radius: 999px;
          border: 1px solid var(--store-border-strong);
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.78rem;
          font-weight: 800;
        }

        .product-title {
          margin: 0;
          color: var(--store-text);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 900;
          line-height: 1.18;
        }

        .product-lead {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.98rem;
          line-height: 1.85;
        }

        .product-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .product-meta span {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--store-text-muted);
          font-size: 0.76rem;
          font-weight: 800;
        }

        .product-meta .product-meta-accent {
          color: ${theme.accent};
          background: ${theme.surface};
        }

        .product-highlight-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .product-highlight {
          padding: 0.9rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--store-border);
        }

        .product-highlight strong {
          display: block;
          margin: 0.25rem 0 0.3rem;
          color: var(--store-text);
          font-size: 0.94rem;
          font-weight: 800;
        }

        .product-highlight p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.82rem;
          line-height: 1.7;
        }

        .product-purchase-card {
          position: sticky;
          top: 5.8rem;
          display: grid;
          gap: 1rem;
          padding: 1.2rem;
          background:
            linear-gradient(180deg, rgba(224, 180, 72, 0.09), rgba(255, 255, 255, 0.02)),
            var(--store-surface);
        }

        .product-price-block {
          padding: 1rem;
          border-radius: 22px;
          border: 1px solid var(--store-border);
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.18), rgba(17, 17, 17, 0.35) 55%),
            #0d0f0d;
          color: #fff;
        }

        .product-price-block span {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .product-price-block strong {
          display: block;
          margin: 0.3rem 0 0.35rem;
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
        }

        .product-price-block strong.is-free {
          color: #86efac;
        }

        .product-price-block p {
          margin: 0;
          color: rgba(255, 255, 255, 0.74);
          font-size: 0.84rem;
          line-height: 1.7;
        }

        .product-purchase-points {
          display: grid;
          gap: 0.65rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .product-purchase-points li {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: var(--store-text-muted);
          font-size: 0.86rem;
          font-weight: 700;
        }

        .product-purchase-note {
          margin: 0;
          color: var(--store-text-soft);
          font-size: 0.78rem;
          line-height: 1.7;
          text-align: center;
        }

        .product-detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .product-detail-card {
          padding: 1.2rem;
        }

        .product-detail-card h2 {
          margin: 0 0 0.5rem;
          color: var(--store-text);
          font-size: 1.18rem;
          font-weight: 900;
        }

        .product-detail-card p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.94rem;
          line-height: 1.9;
        }

        .product-detail-copy {
          display: grid;
          gap: 0.85rem;
        }

        .product-fit-list {
          display: grid;
          gap: 0.75rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .product-fit-list li {
          padding: 0.85rem 0.9rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--store-border);
          color: var(--store-text-muted);
          font-size: 0.88rem;
          line-height: 1.7;
          font-weight: 700;
        }

        .product-tags {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
          margin-top: 0.9rem;
        }

        .product-tags span {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0.28rem 0.7rem;
          border-radius: 999px;
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.76rem;
          font-weight: 800;
        }

        .product-reviews-section {
          margin-top: 1rem;
        }

        .product-review-summary {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
        }

        .product-review-score {
          display: grid;
          gap: 0.35rem;
          align-content: start;
        }

        .product-review-score strong {
          color: var(--store-text);
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1;
        }

        .product-review-score span {
          color: var(--store-text-muted);
          font-size: 0.86rem;
          line-height: 1.8;
        }

        .product-review-stars {
          color: var(--store-accent-strong);
          letter-spacing: 0.16rem;
          font-size: 1.08rem;
          font-weight: 900;
        }

        .product-review-list {
          display: grid;
          gap: 0.8rem;
        }

        .product-review-card {
          padding: 0.95rem;
          border-radius: 18px;
          border: 1px solid var(--store-border);
          background: rgba(255, 255, 255, 0.03);
        }

        .product-review-card h3 {
          margin: 0;
          color: var(--store-text);
          font-size: 0.95rem;
          font-weight: 900;
        }

        .product-review-card p {
          margin: 0.4rem 0 0;
          color: var(--store-text-muted);
          font-size: 0.88rem;
          line-height: 1.9;
        }

        .product-review-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 0.45rem;
        }

        .product-review-date {
          color: var(--store-text-soft);
          font-size: 0.76rem;
          font-weight: 700;
        }

        .product-review-empty {
          padding: 1rem;
          border-radius: 18px;
          border: 1px dashed var(--store-border-strong);
          background: rgba(255, 255, 255, 0.02);
          color: var(--store-text-muted);
          line-height: 1.8;
        }

        .product-review-action {
          display: grid;
          gap: 0.9rem;
          margin-top: 1rem;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
        }

        .product-review-action h2 {
          margin: 0;
          color: var(--store-text);
          font-size: 1.08rem;
          font-weight: 900;
        }

        @media (max-width: 960px) {
          .product-overview,
          .product-detail-grid {
            grid-template-columns: 1fr;
          }

          .product-purchase-card {
            position: static;
            top: auto;
          }
        }

        @media (max-width: 640px) {
          .product-main {
            width: min(calc(100% - 1rem), var(--store-content-width));
            padding-top: 1rem;
          }

          .product-breadcrumbs {
            margin-bottom: 0.85rem;
            font-size: 0.76rem;
          }

          .product-visual {
            min-height: 150px;
            padding: 1rem;
          }

          .product-visual.has-image {
            min-height: 340px;
            padding: 0.82rem;
          }

          .product-visual-icon {
            font-size: 3.2rem;
          }

          .product-visual-chip {
            font-size: 0.72rem;
          }

          .product-copy,
          .product-detail-card,
          .product-purchase-card {
            padding: 0.95rem 0.9rem;
          }

          .product-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 0 0.9rem 0.95rem;
          }

          .product-title {
            font-size: 1.65rem;
          }

          .product-lead,
          .product-detail-card p {
            font-size: 0.9rem;
          }

          .product-highlight-grid {
            grid-template-columns: 1fr;
            gap: 0.6rem;
          }

          .product-price-block strong {
            font-size: 1.72rem;
          }

          .product-review-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <StorefrontHeader
        showBlogLink
        actions={[
          { href: '/store', label: 'المتجر', variant: 'muted' },
          { href: '/cart', label: 'السلة', variant: 'primary' },
        ]}
      />

      <main className="product-main">
        <div className="product-breadcrumbs">
          <Link href="/">الرئيسية</Link>
          <span>›</span>
          <Link href="/store">المتجر</Link>
          {categorySlug && (
            <>
              <span>›</span>
              <Link href={`/store?category=${categorySlug}`}>{categoryName}</Link>
            </>
          )}
          <span>›</span>
          <span>{product.title}</span>
        </div>

        <section className="product-overview">
          <div className="product-content">
            <article className="product-hero-card">
              <div
                className={`product-visual ${productImageUrl ? 'has-image' : ''}`}
                style={{ background: theme.gradient }}
              >
                {productImageUrl ? (
                  <Image
                    src={productImageUrl}
                    alt={product.title}
                    fill
                    priority
                    sizes="(max-width: 960px) 100vw, 60vw"
                    className="product-hero-image"
                  />
                ) : (
                  <span className="product-visual-icon">{theme.icon}</span>
                )}
                <span className="product-visual-chip">
                  {product.is_free ? 'إضافة مجانية فورية' : 'تحميل فوري بعد الدفع'}
                </span>
              </div>

              <div className="product-copy">
                <span className="product-eyebrow">{categoryName}</span>
                <h1 className="product-title">{product.title}</h1>
                <p className="product-lead">{productDescription}</p>

                <div className="product-meta">
                  <span className="product-meta-accent">📂 {categoryName}</span>
                  <span>📊 {levelLabels[product.level] ?? product.level}</span>
                  <span>{product.is_free ? '🎁 مجاني بالكامل' : '💳 دفعة واحدة'}</span>
                </div>

                <div className="product-highlight-grid">
                  {trustItems.map(item => (
                    <div key={item.title} className="product-highlight">
                      <span>{item.icon}</span>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {productImages.length > 1 && (
                <div className="product-gallery">
                  {productImages.slice(1).map((image, index) => (
                    <div key={image.path} className="product-gallery-item">
                      <Image
                        src={image.url}
                        alt={`${product.title} - صورة ${index + 2}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 180px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          <aside className="product-purchase-card">
            <div className="product-price-block">
              <span>{product.is_free ? 'الوصول' : 'السعر'}</span>
              <strong className={product.is_free ? 'is-free' : ''}>
                {product.is_free ? 'مجاني' : `${product.price} ريال`}
              </strong>
              <p>
                {product.is_free
                  ? 'أضف البرنامج للسلة ثم أكمل الطلب المجاني بخطوات سريعة.'
                  : 'أضف البرنامج إلى السلة ثم أكمل الدفع، وبعدها يصلك الوصول مباشرة.'}
              </p>
            </div>

            <ul className="product-purchase-points">
              <li>
                <span>✓</span>
                <span>{product.is_free ? 'بدون رسوم لهذا المنتج' : 'دفع آمن عبر PayPal'}</span>
              </li>
              <li>
                <span>✓</span>
                <span>يمكن مراجعة الطلب من السلة قبل الإتمام</span>
              </li>
              <li>
                <span>✓</span>
                <span>الفاتورة والوصول يرسلان مباشرة إلى بريدك</span>
              </li>
            </ul>

            <AddToCartButton
              product={{
                id: product.id,
                title: product.title,
                price: product.price,
                is_free: product.is_free,
                slug: product.slug,
                categorySlug: categorySlug ?? '',
              }}
            />

            <p className="product-purchase-note">
              إذا أضفت أكثر من برنامج يمكنك إتمامها كلها من السلة في طلب واحد.
            </p>
          </aside>
        </section>

        <section className="product-detail-grid">
          <article className="product-detail-card">
            <h2>عن البرنامج</h2>
            <div className="product-detail-copy">
              {descriptionBlocks.map((block, index) => (
                <p key={index}>{block}</p>
              ))}
            </div>
          </article>

          <article className="product-detail-card">
            <h2>مناسب لك إذا</h2>
            <ul className="product-fit-list">
              <li>تريد شراء البرنامج والوصول إليه بسهولة من أي جهاز.</li>
              <li>
                تريد برنامجًا من فئة <strong>{categoryName}</strong> بمستوى{' '}
                <strong>{levelLabels[product.level] ?? product.level}</strong>.
              </li>
              <li>تفضّل الوصول الفوري بعد الإتمام مع ظهور الطلب وروابط الوصول بشكل منظم.</li>
            </ul>

            {!!product.tags?.length && (
              <div className="product-tags">
                {product.tags.map(tag => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="product-reviews-section">
          <article className="product-review-summary">
            <div className="product-review-score">
              <span>آراء المشترين</span>
              <strong>
                {reviewSummary.reviewsCount > 0 ? reviewSummary.averageRating.toFixed(1) : '—'}
              </strong>
              <div className="product-review-stars" aria-hidden="true">
                {'★'.repeat(Math.round(reviewSummary.averageRating || 0)).padEnd(5, '☆')}
              </div>
              <span>
                {reviewSummary.reviewsCount > 0
                  ? `${reviewSummary.reviewsCount} تقييمات معتمدة من مشترين حقيقيين`
                  : 'لا توجد تقييمات معتمدة لهذا المنتج بعد.'}
              </span>
            </div>

            <div className="product-review-list">
              {reviewSummary.reviewsCount === 0 ? (
                <div className="product-review-empty">
                  أول تقييم سيظهر هنا بعد أن يشتري عميل المنتج ويرسل تقييمه ويتم
                  اعتماده من الإدارة.
                </div>
              ) : (
                reviewSummary.reviews.slice(0, 4).map(review => (
                  <article key={review.id} className="product-review-card">
                    <div className="product-review-meta">
                      <h3>{review.customerName}</h3>
                      <span className="product-review-date">
                        {new Intl.DateTimeFormat('ar-SA', {
                          dateStyle: 'medium',
                        }).format(new Date(review.createdAt))}
                      </span>
                    </div>
                    <div className="product-review-stars" aria-hidden="true">
                      {'★'.repeat(review.rating).padEnd(5, '☆')}
                    </div>
                    <p>{review.comment || 'تجربة موثقة بدون تعليق نصي إضافي.'}</p>
                  </article>
                ))
              )}
            </div>
          </article>

          {reviewAccess && reviewAccess.initialReview?.status !== 'approved' && (
            <article className="product-review-action">
              <h2>تقييمك لهذا المنتج</h2>
              <ProductReviewForm
                orderId={reviewAccess.orderId}
                productId={product.id}
                productTitle={product.title}
                initialReview={reviewAccess.initialReview}
              />
            </article>
          )}
        </section>
      </main>

      <StorefrontFooter note="اطلع على تفاصيل البرنامج قبل إضافته إلى السلة." />
    </div>
  )
}
