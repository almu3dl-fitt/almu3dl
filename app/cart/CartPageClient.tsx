'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AddToCartButton from '@/app/components/AddToCartButton'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'
import { getCart, removeFromCart, getCartTotal, type CartItem } from '@/lib/cart'

export type CartRecommendation = {
  id: string
  title: string
  slug: string
  price: number
  is_free: boolean
  categorySlug: string
  categoryName: string
  description: string | null
  imageUrl: string | null
}

const categoryLabels: Record<string, string> = {
  nutrition: 'تغذية',
  workouts: 'تمارين',
  therapy: 'علاجية',
  bundles: 'باقة',
}

const categoryIcons: Record<string, string> = {
  nutrition: '🥗',
  workouts: '🏋🏻',
  therapy: '🩺',
  bundles: '📦',
}

const recommendationPriorityByCategory: Record<string, string[]> = {
  nutrition: [
    'beginner-workout-4days',
    'busy-program',
    'workout-bundle',
    'total-transformation',
    'rehab-bundle',
  ],
  workouts: [
    'nutrition-bundle',
    'flexible-diet-1500',
    'flexible-diet-1800',
    'healthy-recipes-book',
    'rehab-bundle',
  ],
  therapy: [
    'rehab-bundle',
    'nutrition-bundle',
    'healthy-recipes-book',
    'busy-program',
    'beginner-workout-4days',
  ],
  bundles: [
    'flexible-diet-1500',
    'busy-program',
    'back-therapy',
    'healthy-recipes-book',
    'total-transformation',
  ],
}

const fallbackRecommendationSlugs = [
  'healthy-recipes-book',
  'nutrition-bundle',
  'workout-bundle',
  'rehab-bundle',
  'total-transformation',
  'busy-program',
  'back-therapy',
]

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trim()}…`
}

function getRecommendedProducts(
  cart: CartItem[],
  recommendationProducts: CartRecommendation[],
) {
  const bySlug = new Map(recommendationProducts.map(product => [product.slug, product] as const))
  const cartSlugs = new Set(cart.map(item => item.slug))
  const cartCategories = Array.from(new Set(cart.map(item => item.categorySlug)))
  const seen = new Set<string>()
  const picked: CartRecommendation[] = []

  const candidateSlugs = [
    ...cartCategories.flatMap(category => recommendationPriorityByCategory[category] ?? []),
    ...fallbackRecommendationSlugs,
  ]

  for (const slug of candidateSlugs) {
    if (cartSlugs.has(slug) || seen.has(slug)) {
      continue
    }

    const product = bySlug.get(slug)
    if (!product) {
      continue
    }

    picked.push(product)
    seen.add(slug)

    if (picked.length === 3) {
      return picked
    }
  }

  for (const product of recommendationProducts) {
    if (cartSlugs.has(product.slug) || seen.has(product.slug)) {
      continue
    }

    picked.push(product)
    seen.add(product.slug)

    if (picked.length === 3) {
      break
    }
  }

  return picked
}

export default function CartPageClient({
  recommendationProducts,
}: {
  recommendationProducts: CartRecommendation[]
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const updateCart = () => {
      setCart(getCart())
    }

    const frame = window.requestAnimationFrame(() => {
      updateCart()
      setHydrated(true)
    })

    window.addEventListener('cart-updated', updateCart)
    window.addEventListener('storage', updateCart)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('cart-updated', updateCart)
      window.removeEventListener('storage', updateCart)
    }
  }, [])

  const handleRemove = (id: string) => {
    const updated = removeFromCart(id)
    setCart(updated)
  }

  const recommendedProducts = useMemo(
    () => getRecommendedProducts(cart, recommendationProducts),
    [cart, recommendationProducts],
  )

  const total = getCartTotal(cart)
  const totalLabel = total === 0 ? 'مجاني' : `${total} ريال`

  return (
    <div className="cart-page-shell storefront-shell">
      <style>{`
        .cart-page-shell {
          font-family: var(--font-tajawal), 'Arial', sans-serif;
          direction: rtl;
        }

        .cart-main {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1.4rem 0 0;
        }

        .cart-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 0.9rem;
          margin-bottom: 1rem;
          padding: 1.4rem;
          border: 1px solid var(--store-border);
          border-radius: var(--store-radius-xl);
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.12), rgba(255, 255, 255, 0.02) 46%),
            var(--store-surface);
          box-shadow: var(--store-shadow);
        }

        .cart-eyebrow {
          display: inline-flex;
          margin-bottom: 0.55rem;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          border: 1px solid var(--store-border-strong);
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.76rem;
          font-weight: 800;
        }

        .cart-hero h1 {
          margin: 0 0 0.45rem;
          color: var(--store-text);
          font-size: clamp(1.85rem, 4vw, 2.8rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .cart-hero p {
          max-width: 620px;
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.94rem;
          line-height: 1.8;
        }

        .cart-hero-summary {
          min-width: 200px;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
        }

        .cart-hero-summary span {
          display: block;
          color: var(--store-text-muted);
          font-size: 0.86rem;
          font-weight: 700;
        }

        .cart-hero-summary strong {
          display: block;
          margin-top: 0.25rem;
          color: var(--store-accent-strong);
          font-size: 1.5rem;
          font-weight: 900;
        }

        .cart-loading,
        .cart-empty {
          padding: 2rem 1.25rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          text-align: center;
          box-shadow: var(--store-card-shadow);
        }

        .cart-loading p,
        .cart-empty p {
          margin: 0;
          color: var(--store-text-muted);
          line-height: 1.8;
        }

        .cart-empty-icon {
          display: block;
          margin-bottom: 0.65rem;
          font-size: 2.35rem;
        }

        .cart-empty-title {
          margin-bottom: 0.45rem !important;
          color: var(--store-text) !important;
          font-size: 1.18rem;
          font-weight: 800;
        }

        .cart-empty-actions {
          display: flex;
          justify-content: center;
          gap: 0.65rem;
          margin-top: 1.1rem;
          flex-wrap: wrap;
        }

        .cart-empty-primary,
        .cart-empty-secondary,
        .cart-summary-primary,
        .cart-summary-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0.75rem 1.2rem;
          border-radius: 14px;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .cart-empty-primary,
        .cart-summary-primary {
          background: linear-gradient(135deg, #fff0bf, var(--store-accent));
          color: #111;
          box-shadow: 0 14px 24px rgba(224, 180, 72, 0.2);
        }

        .cart-empty-secondary,
        .cart-summary-secondary {
          border: 1px solid var(--store-border);
          background: rgba(255, 255, 255, 0.03);
          color: var(--store-text);
        }

        .cart-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.95fr);
          gap: 0.85rem;
          align-items: start;
        }

        .cart-list {
          display: grid;
          gap: 0.75rem;
        }

        .cart-list-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.05rem;
          flex-wrap: wrap;
        }

        .cart-list-head h2 {
          margin: 0;
          color: var(--store-text);
          font-size: 1.08rem;
          font-weight: 800;
        }

        .cart-list-head p {
          margin: 0;
          color: var(--store-text-soft);
          font-size: 0.88rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr);
          gap: 0.8rem;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
          transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .cart-item:hover {
          transform: translateY(-2px);
          border-color: var(--store-border-strong);
          box-shadow: 0 18px 32px rgba(0, 0, 0, 0.3);
        }

        .cart-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(255, 239, 191, 0.16), rgba(224, 180, 72, 0.08));
          color: var(--store-accent-strong);
          font-size: 1.55rem;
        }

        .cart-item-content {
          min-width: 0;
          display: grid;
          gap: 0.55rem;
        }

        .cart-item-tags {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .cart-item-tag {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--store-text-soft);
          font-size: 0.7rem;
          font-weight: 800;
        }

        .cart-item-tag.is-free {
          background: var(--store-success-wash);
          color: #7ce6a5;
        }

        .cart-item-title {
          margin: 0;
          color: var(--store-text);
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.45;
        }

        .cart-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        .cart-item-price {
          color: var(--store-accent-strong);
          font-size: 1.08rem;
          font-weight: 900;
        }

        .cart-item-price.is-free {
          color: #7ce6a5;
        }

        .cart-item-remove {
          border: none;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--store-text-muted);
          padding: 0.52rem 0.8rem;
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 800;
          font-family: var(--font-tajawal), Arial, sans-serif;
        }

        .cart-summary {
          position: sticky;
          top: 0.8rem;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.11), rgba(255, 255, 255, 0.02) 58%),
            var(--store-surface);
          box-shadow: var(--store-shadow);
        }

        .cart-summary h2 {
          margin: 0 0 0.35rem;
          color: var(--store-text);
          font-size: 1.18rem;
          font-weight: 900;
        }

        .cart-summary p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.88rem;
          line-height: 1.7;
        }

        .cart-summary-total {
          margin: 1rem 0 0.9rem;
          padding: 1rem;
          border-radius: 18px;
          border: 1px solid var(--store-border);
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.18), rgba(17, 17, 17, 0.35) 55%),
            #0d0f0d;
          color: #fff;
        }

        .cart-summary-total span {
          display: block;
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.8rem;
          font-weight: 700;
        }

        .cart-summary-total strong {
          display: block;
          margin-top: 0.25rem;
          font-size: 1.55rem;
          font-weight: 900;
        }

        .cart-summary-list {
          display: grid;
          gap: 0.65rem;
          margin: 0 0 0.9rem;
          padding: 0;
          list-style: none;
        }

        .cart-summary-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          color: var(--store-text-muted);
          font-size: 0.92rem;
          font-weight: 700;
        }

        .cart-summary-actions {
          display: grid;
          gap: 0.65rem;
        }

        .cart-summary-actions a {
          min-height: 50px;
        }

        .cart-recommendations {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.08), rgba(255, 255, 255, 0.02) 54%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
        }

        .cart-recommendations-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cart-recommendations-head h2 {
          margin: 0;
          color: var(--store-text);
          font-size: 1.08rem;
          font-weight: 900;
        }

        .cart-recommendations-head p {
          margin: 0.3rem 0 0;
          color: var(--store-text-soft);
          font-size: 0.86rem;
          line-height: 1.8;
        }

        .cart-recommendations-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          border: 1px solid var(--store-border-strong);
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.76rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .cart-recommendations-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .cart-recommendation-card {
          display: grid;
          gap: 0.85rem;
          overflow: hidden;
          padding: 0.85rem;
          border-radius: 22px;
          border: 1px solid var(--store-border);
          background: rgba(255, 255, 255, 0.03);
        }

        .cart-recommendation-media {
          position: relative;
          min-height: 180px;
          overflow: hidden;
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.16), rgba(255, 255, 255, 0.03)),
            rgba(255, 255, 255, 0.02);
        }

        .cart-recommendation-media img {
          object-fit: cover;
        }

        .cart-recommendation-fallback {
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          color: var(--store-accent-strong);
          font-size: 2rem;
        }

        .cart-recommendation-body {
          display: grid;
          gap: 0.65rem;
        }

        .cart-recommendation-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .cart-recommendation-tag {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.72rem;
          font-weight: 800;
        }

        .cart-recommendation-price {
          color: var(--store-accent-strong);
          font-size: 0.94rem;
          font-weight: 900;
        }

        .cart-recommendation-price.is-free {
          color: #7ce6a5;
        }

        .cart-recommendation-title {
          margin: 0;
          color: var(--store-text);
          font-size: 0.96rem;
          font-weight: 900;
          line-height: 1.5;
        }

        .cart-recommendation-description {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.82rem;
          line-height: 1.8;
        }

        .cart-recommendation-actions {
          display: grid;
          gap: 0.65rem;
        }

        .cart-recommendation-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0.65rem 0.9rem;
          border-radius: 14px;
          border: 1px solid var(--store-border);
          background: rgba(255, 255, 255, 0.03);
          color: var(--store-text);
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 800;
        }

        @media (max-width: 860px) {
          .cart-hero {
            flex-direction: column;
            align-items: stretch;
          }

          .cart-layout {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .cart-summary {
            position: static;
          }

          .cart-recommendations-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .cart-main {
            width: min(calc(100% - 1rem), var(--store-content-width));
            padding-top: 1rem;
          }

          .cart-hero h1 {
            font-size: 1.58rem;
          }

          .cart-hero-summary {
            padding: 0.82rem 0.9rem;
          }

          .cart-item {
            grid-template-columns: 52px minmax(0, 1fr);
            gap: 0.72rem;
            padding: 0.82rem;
          }

          .cart-item-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            font-size: 1.3rem;
          }

          .cart-item-title {
            font-size: 0.94rem;
          }

          .cart-item-footer {
            flex-direction: row;
            align-items: center;
          }

          .cart-summary-primary,
          .cart-summary-secondary {
            width: 100%;
          }

          .cart-recommendations {
            padding: 0.9rem 0.85rem;
            border-radius: 18px;
          }

          .cart-recommendation-media {
            min-height: 160px;
          }
        }
      `}</style>

      <StorefrontHeader
        showCart={false}
        actions={[
          { href: '/store', label: 'المتجر', variant: 'muted' },
          { href: '/checkout', label: 'إتمام الطلب', variant: 'primary' },
        ]}
      />

      <main className="cart-main">
        <section className="cart-hero">
          <div>
            <span className="cart-eyebrow">السلة</span>
            <h1>راجع طلبك قبل الإتمام</h1>
            <p>
              تأكد من البرامج المختارة والمجموع النهائي قبل الانتقال إلى الدفع.
            </p>
          </div>

          <div className="cart-hero-summary">
            <span>{hydrated ? `${cart.length} برامج في السلة` : 'جار تحميل السلة'}</span>
            <strong>{hydrated ? totalLabel : '...'}</strong>
          </div>
        </section>

        {!hydrated ? (
          <div className="cart-loading">
            <p>جار تجهيز السلة وقراءة المنتجات المحفوظة على جهازك...</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <p className="cart-empty-title">السلة فاضية حاليًا</p>
            <p>أضف برنامج أو أكثر من المتجر، وبعدها نكمل الطلب بخطوات بسيطة.</p>

            <div className="cart-empty-actions">
              <Link href="/store" className="cart-empty-primary">
                تصفّح البرامج
              </Link>
              <Link href="/" className="cart-empty-secondary">
                العودة للرئيسية
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="cart-layout">
              <section className="cart-list">
                <div className="cart-list-head">
                  <div>
                    <h2>المنتجات المختارة</h2>
                    <p>راجع البرامج المختارة وتأكد من الأسعار قبل إتمام الطلب.</p>
                  </div>
                  <p>{cart.length} عناصر</p>
                </div>

                {cart.map(item => (
                  <article key={item.id} className="cart-item">
                    <div className="cart-item-icon">
                      {item.is_free ? '🎁' : categoryIcons[item.categorySlug] ?? '📦'}
                    </div>

                    <div className="cart-item-content">
                      <div className="cart-item-tags">
                        <span className="cart-item-tag">
                          {categoryLabels[item.categorySlug] ?? 'برنامج رقمي'}
                        </span>
                        {item.is_free && <span className="cart-item-tag is-free">مجاني</span>}
                      </div>

                      <h3 className="cart-item-title">{item.title}</h3>

                      <div className="cart-item-footer">
                        <span className={`cart-item-price ${item.is_free ? 'is-free' : ''}`}>
                          {item.is_free ? 'مجاني' : `${item.price} ريال`}
                        </span>

                        <button
                          onClick={() => handleRemove(item.id)}
                          className="cart-item-remove"
                        >
                          إزالة
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <aside className="cart-summary">
                <h2>ملخص الطلب</h2>
                <p>المجموع النهائي ووسيلة الدفع والوصول بعد الإتمام موضحة هنا.</p>

                <div className="cart-summary-total">
                  <span>المجموع النهائي</span>
                  <strong>{totalLabel}</strong>
                </div>

                <ul className="cart-summary-list">
                  <li>
                    <span>عدد المنتجات</span>
                    <span>{cart.length}</span>
                  </li>
                  <li>
                    <span>الوصول بعد الإتمام</span>
                    <span>فوري</span>
                  </li>
                  <li>
                    <span>الدفع</span>
                    <span>{total === 0 ? 'بدون دفع' : 'PayPal'}</span>
                  </li>
                </ul>

                <div className="cart-summary-actions">
                  <Link href="/checkout" className="cart-summary-primary">
                    إتمام الطلب
                  </Link>
                  <Link href="/store" className="cart-summary-secondary">
                    إضافة برامج أخرى
                  </Link>
                </div>
              </aside>
            </div>

            {recommendedProducts.length > 0 && (
              <section className="cart-recommendations">
                <div className="cart-recommendations-head">
                  <div>
                    <h2>أضف مع طلبك</h2>
                    <p>
                      ترشيحات مكملة مبنية على نوع البرامج الموجودة الآن في سلتك حتى
                      تكتمل الفائدة في نفس الطلب.
                    </p>
                  </div>
                  <span className="cart-recommendations-pill">ترشيحات ذكية</span>
                </div>

                <div className="cart-recommendations-grid">
                  {recommendedProducts.map(product => (
                    <article key={product.id} className="cart-recommendation-card">
                      <div className="cart-recommendation-media">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            sizes="(max-width: 860px) 100vw, 30vw"
                          />
                        ) : (
                          <span className="cart-recommendation-fallback">
                            {categoryIcons[product.categorySlug] ?? '📦'}
                          </span>
                        )}
                      </div>

                      <div className="cart-recommendation-body">
                        <div className="cart-recommendation-meta">
                          <span className="cart-recommendation-tag">{product.categoryName}</span>
                          <span
                            className={`cart-recommendation-price ${product.is_free ? 'is-free' : ''}`}
                          >
                            {product.is_free ? 'مجاني' : `${product.price} ريال`}
                          </span>
                        </div>

                        <h3 className="cart-recommendation-title">{product.title}</h3>
                        <p className="cart-recommendation-description">
                          {truncateText(
                            product.description?.trim() ||
                              'برنامج رقمي جاهز يضيف قيمة واضحة لطلبك الحالي.',
                            110,
                          )}
                        </p>
                      </div>

                      <div className="cart-recommendation-actions">
                        <AddToCartButton
                          product={{
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            is_free: product.is_free,
                            slug: product.slug,
                            categorySlug: product.categorySlug,
                          }}
                        />
                        <Link
                          href={`/store/${product.slug}`}
                          className="cart-recommendation-link"
                        >
                          عرض التفاصيل
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <StorefrontFooter note="راجع طلبك ثم انتقل إلى الدفع عندما تكون جاهزًا." />
    </div>
  )
}
