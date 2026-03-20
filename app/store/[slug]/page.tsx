import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import CartIcon from '@/app/components/CartIcon'
import AddToCartButton from '@/app/components/AddToCartButton'
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
    gradient: 'linear-gradient(135deg, #D4A843, #B8912E)',
    accent: '#B8912E',
    surface: '#fff7e8',
  },
  workouts: {
    icon: '🏋🏻',
    gradient: 'linear-gradient(135deg, #111111, #2f2f2f)',
    accent: '#1a1a1a',
    surface: '#f4f4f4',
  },
  therapy: {
    icon: '🩺',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    accent: '#2563eb',
    surface: '#eff6ff',
  },
  bundles: {
    icon: '📦',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    accent: '#7c3aed',
    surface: '#f5f3ff',
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
        gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
        accent: '#16a34a',
        surface: '#ecfdf3',
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
      text: 'الواجهة مختصرة ومريحة للشراء والتحميل من الهاتف أو الكمبيوتر.',
    },
  ]

  return (
    <div className="product-page-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .product-page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 28%),
            #fafafa;
          color: #1a1a1a;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .product-nav {
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

        .product-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
        }

        .product-brand img {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .product-brand span {
          font-size: 1.16rem;
          font-weight: 900;
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .product-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .product-nav-link {
          color: #555;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .product-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1.25rem 1.15rem 3.5rem;
        }

        .product-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 1rem;
          color: #8a8a8a;
          font-size: 0.82rem;
          font-weight: 700;
          flex-wrap: wrap;
        }

        .product-breadcrumbs a {
          color: #b8912e;
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
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 16px 30px rgba(17, 17, 17, 0.05);
        }

        .product-hero-card {
          overflow: hidden;
        }

        .product-visual {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          min-height: 210px;
          padding: 1.35rem;
          color: #fff;
        }

        .product-visual::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 22px,
            rgba(255, 255, 255, 0.07) 22px,
            rgba(255, 255, 255, 0.07) 23px
          );
          pointer-events: none;
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
          padding: 0.45rem 0.8rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
          font-size: 0.8rem;
          font-weight: 800;
        }

        .product-copy {
          display: grid;
          gap: 0.9rem;
          padding: 1.35rem;
        }

        .product-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          padding: 0.34rem 0.78rem;
          border-radius: 999px;
          background: rgba(184, 145, 46, 0.12);
          color: #8f6a14;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .product-title {
          margin: 0;
          font-size: clamp(1.9rem, 4vw, 2.65rem);
          font-weight: 900;
          line-height: 1.25;
        }

        .product-lead {
          margin: 0;
          color: #6f6f6f;
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
          background: #f5f5f5;
          color: #656565;
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
          background: #fcfbf8;
          border: 1px solid rgba(17, 17, 17, 0.05);
        }

        .product-highlight strong {
          display: block;
          margin: 0.25rem 0 0.3rem;
          font-size: 0.94rem;
          font-weight: 800;
        }

        .product-highlight p {
          margin: 0;
          color: #7d7d7d;
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
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 250, 246, 0.98));
        }

        .product-price-block {
          padding: 1rem;
          border-radius: 18px;
          background: #111;
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
          color: rgba(255, 255, 255, 0.76);
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
          color: #666;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .product-purchase-note {
          margin: 0;
          color: #898989;
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
          font-size: 1.15rem;
          font-weight: 900;
        }

        .product-detail-card p {
          margin: 0;
          color: #6e6e6e;
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
          background: #fcfbf8;
          border: 1px solid rgba(17, 17, 17, 0.05);
          color: #555;
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
          background: #fef7e5;
          color: #a16f00;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .product-footer {
          padding: 1.8rem 1.25rem;
          border-top: 1px solid #eee;
          background: #fff;
          color: #bbb;
          font-size: 0.8rem;
          text-align: center;
          margin-top: 3rem;
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
          .product-nav {
            gap: 0.6rem;
            padding: 0.72rem 0.9rem;
          }

          .product-brand img {
            width: 40px;
            height: 40px;
          }

          .product-brand span {
            font-size: 0.98rem;
          }

          .product-nav-actions {
            gap: 0.55rem;
          }

          .product-nav-link {
            font-size: 0.82rem;
          }

          .product-main {
            padding: 0.95rem 0.8rem 2.8rem;
          }

          .product-breadcrumbs {
            margin-bottom: 0.85rem;
            font-size: 0.76rem;
          }

          .product-visual {
            min-height: 150px;
            padding: 1rem;
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
        }
      `}</style>

      <nav className="product-nav">
        <Link href="/" className="product-brand">
          <Image src="/logo.png" alt="المعضل" width={48} height={48} />
          <span>المعضل</span>
        </Link>

        <div className="product-nav-actions">
          <CartIcon />
          <Link href="/store" className="product-nav-link">
            ← المتجر
          </Link>
        </div>
      </nav>

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
              <div className="product-visual" style={{ background: theme.gradient }}>
                <span className="product-visual-icon">{theme.icon}</span>
                <span className="product-visual-chip">
                  {product.is_free ? 'إضافة مجانية' : 'تحميل فوري بعد الدفع'}
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
                  : 'زر الإضافة ينقلك إلى رحلة شراء مختصرة وواضحة حتى الدفع ثم التحميل.'}
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
              إذا أضفت أكثر من برنامج يمكنك إكمالها كلها من السلة بنفس التجربة المختصرة.
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
              <li>تبحث عن تجربة شراء عربية واضحة وسريعة على الجوال بدون ازدحام بصري.</li>
              <li>
                تريد برنامجًا من فئة <strong>{categoryName}</strong> بمستوى{' '}
                <strong>{levelLabels[product.level] ?? product.level}</strong>.
              </li>
              <li>تفضّل الوصول الفوري بعد الإتمام مع تنظيم واضح في السلة وcheckout.</li>
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
      </main>

      <footer className="product-footer">
        <p>© {new Date().getFullYear()} المعضل — Almu3dl. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  )
}
