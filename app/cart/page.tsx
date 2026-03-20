'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import AccountNavLink from '@/app/components/AccountNavLink'
import { getCart, removeFromCart, getCartTotal, type CartItem } from '@/lib/cart'

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

export default function CartPage() {
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

  const total = getCartTotal(cart)
  const totalLabel = total === 0 ? 'مجاني' : `${total} ريال`

  return (
    <div className="cart-page-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .cart-page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(212, 168, 67, 0.1), transparent 28%),
            #fafafa;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
          color: #1a1a1a;
        }

        .cart-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.85rem;
          padding: 0.82rem 1.2rem;
          border-bottom: 1px solid rgba(17, 17, 17, 0.07);
          background-color: rgba(250, 250, 250, 0.92);
          backdrop-filter: blur(14px);
        }

        .cart-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
        }

        .cart-brand img {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .cart-brand span {
          font-size: 1.12rem;
          font-weight: 900;
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cart-nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0.55rem 0.85rem;
          border-radius: 12px;
          border: 1px solid #ececec;
          background: rgba(255, 255, 255, 0.9);
          color: #555;
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .cart-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          flex-wrap: wrap;
        }

        .cart-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1.15rem 1.1rem 2.8rem;
        }

        .cart-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 0.9rem;
          margin-bottom: 1rem;
        }

        .cart-eyebrow {
          display: inline-flex;
          margin-bottom: 0.55rem;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          background: rgba(184, 145, 46, 0.12);
          color: #8f6a14;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .cart-hero h1 {
          margin: 0 0 0.45rem;
          font-size: clamp(1.75rem, 4vw, 2.55rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .cart-hero p {
          max-width: 620px;
          margin: 0;
          color: #757575;
          font-size: 0.94rem;
          line-height: 1.7;
        }

        .cart-hero-summary {
          min-width: 200px;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(184, 145, 46, 0.18);
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 16px 28px rgba(17, 17, 17, 0.05);
        }

        .cart-hero-summary span {
          display: block;
          color: #777;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .cart-hero-summary strong {
          display: block;
          margin-top: 0.25rem;
          font-size: 1.32rem;
          font-weight: 900;
        }

        .cart-loading,
        .cart-empty {
          padding: 2rem 1.25rem;
          border: 1px solid rgba(17, 17, 17, 0.07);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.9);
          text-align: center;
          box-shadow: 0 16px 32px rgba(17, 17, 17, 0.04);
        }

        .cart-loading p,
        .cart-empty p {
          margin: 0;
          color: #8b8b8b;
          line-height: 1.8;
        }

        .cart-empty-icon {
          display: block;
          margin-bottom: 0.65rem;
          font-size: 2.35rem;
        }

        .cart-empty-title {
          margin-bottom: 0.45rem !important;
          color: #1a1a1a !important;
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
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
          box-shadow: 0 14px 24px rgba(184, 145, 46, 0.2);
        }

        .cart-empty-secondary,
        .cart-summary-secondary {
          border: 1px solid #e7e7e7;
          background: #fff;
          color: #555;
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
          font-size: 1.05rem;
          font-weight: 800;
        }

        .cart-list-head p {
          margin: 0;
          color: #7b7b7b;
          font-size: 0.88rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr);
          gap: 0.8rem;
          padding: 0.9rem;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 12px 24px rgba(17, 17, 17, 0.04);
          transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .cart-item:hover {
          transform: translateY(-2px);
          border-color: rgba(184, 145, 46, 0.18);
          box-shadow: 0 16px 28px rgba(17, 17, 17, 0.06);
        }

        .cart-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, #fff8e6, #f4ead0);
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
          background: #f5f5f5;
          color: #666;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .cart-item-tag.is-free {
          background: #ecfdf3;
          color: #15803d;
        }

        .cart-item-title {
          margin: 0;
          color: #1a1a1a;
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
          color: #b8912e;
          font-size: 1.08rem;
          font-weight: 900;
        }

        .cart-item-price.is-free {
          color: #16a34a;
        }

        .cart-item-remove {
          border: none;
          border-radius: 10px;
          background: #f7f7f7;
          color: #6f6f6f;
          padding: 0.45rem 0.7rem;
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: 'Tajawal', Arial, sans-serif;
        }

        .cart-summary {
          position: sticky;
          top: 0.8rem;
          padding: 1rem;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 20px;
          background: linear-gradient(180deg, #ffffff, #fbfaf6);
          box-shadow: 0 18px 30px rgba(17, 17, 17, 0.05);
        }

        .cart-summary h2 {
          margin: 0 0 0.35rem;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .cart-summary p {
          margin: 0;
          color: #7b7b7b;
          font-size: 0.88rem;
          line-height: 1.7;
        }

        .cart-summary-total {
          margin: 1rem 0 0.9rem;
          padding: 0.9rem;
          border-radius: 16px;
          background: #111;
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
          color: #555;
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
        }

        @media (max-width: 640px) {
          .cart-nav {
            gap: 0.6rem;
            padding: 0.72rem 0.9rem;
          }

          .cart-brand img {
            width: 40px;
            height: 40px;
          }

          .cart-brand span {
            font-size: 0.98rem;
          }

          .cart-main {
            padding: 0.95rem 0.8rem 2.2rem;
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
        }
      `}</style>

      <nav className="cart-nav">
        <Link href="/" className="cart-brand">
          <Image src="/logo.png" alt="المعضل" width={48} height={48} />
          <span>المعضل</span>
        </Link>

        <div className="cart-nav-actions">
          <AccountNavLink className="cart-nav-link" />
          <Link href="/store" className="cart-nav-link">
            ← المتجر
          </Link>
        </div>
      </nav>

      <main className="cart-main">
        <section className="cart-hero">
          <div>
            <span className="cart-eyebrow">السلة</span>
            <h1>راجع طلبك قبل الإتمام</h1>
            <p>
              رتّبنا المنتجات والإجمالي في تسلسل أوضح على الجوال حتى تكون
              الخطوة التالية مباشرة بدون فراغات أو ازدحام بصري.
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
          <div className="cart-layout">
            <section className="cart-list">
              <div className="cart-list-head">
                <div>
                  <h2>المنتجات المختارة</h2>
                  <p>السعر والحذف والإجراء صاروا في مكان أوضح وأسهل للمس.</p>
                </div>
                <p>{cart.length} عناصر</p>
              </div>

              {cart.map((item) => (
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
              <p>أبرزنا الإجمالي وزر الإتمام حتى تكون رحلة التحويل أوضح وأسرع.</p>

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
        )}
      </main>
    </div>
  )
}
