'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getCart, getCartTotal, clearCart, type CartItem } from '@/lib/cart'

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  })

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

  const total = getCartTotal(cart)
  const totalLabel = total === 0 ? 'مجاني' : `${total} ريال`

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim()) {
      setError('ادخل اسمك الكامل')
      return
    }
    if (!isValidEmail(form.email)) {
      setError('ادخل بريد إلكتروني صحيح')
      return
    }

    setLoading(true)

    // لو كل المنتجات مجانية
    if (total === 0) {
      try {
        const res = await fetch('/api/free-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            full_name: form.full_name,
            phone: form.phone || null,
            items: cart.map(i => ({ id: i.id, price: 0 })),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'حصل خطأ')
          setLoading(false)
          return
        }
        clearCart()
        window.location.href = `/success?order=${data.orderId}`
      } catch {
        setError('حصل خطأ، حاول مرة ثانية')
      }
      setLoading(false)
      return
    }

    // منتجات مدفوعة — PayPal
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          full_name: form.full_name,
          phone: form.phone || null,
          items: cart.map(i => ({ id: i.id, price: i.price })),
          total,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'حصل خطأ')
        setLoading(false)
        return
      }
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      }
    } catch {
      setError('حصل خطأ، حاول مرة ثانية')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.82rem 0.95rem',
    fontSize: '0.98rem',
    border: '1px solid #ddd',
    borderRadius: '13px',
    fontFamily: "'Tajawal', Arial, sans-serif",
    direction: 'rtl' as const,
    outline: 'none',
    backgroundColor: '#fff',
  }

  if (hydrated && cart.length === 0) {
    return (
      <div className="checkout-page-shell checkout-empty-state">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

          .checkout-page-shell {
            min-height: 100vh;
            background:
              radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 30%),
              #fafafa;
            font-family: 'Tajawal', 'Arial', sans-serif;
            direction: rtl;
            color: #1a1a1a;
          }

          .checkout-empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }

          .checkout-empty-card {
            width: min(100%, 460px);
            padding: 1.8rem 1.25rem;
            border: 1px solid rgba(17, 17, 17, 0.07);
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.94);
            text-align: center;
            box-shadow: 0 18px 32px rgba(17, 17, 17, 0.05);
          }

          .checkout-empty-card p {
            margin: 0;
          }

          .checkout-empty-card .checkout-empty-icon {
            font-size: 2.6rem;
            margin-bottom: 0.65rem;
          }

          .checkout-empty-card .checkout-empty-title {
            margin-bottom: 0.45rem;
            font-size: 1.2rem;
            font-weight: 900;
          }

          .checkout-empty-card .checkout-empty-copy {
            color: #888;
            line-height: 1.8;
          }

          .checkout-empty-card a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 1.4rem;
            min-height: 48px;
            padding: 0.75rem 1.2rem;
            border-radius: 14px;
            background: linear-gradient(135deg, #d4a843, #b8912e);
            color: #fff;
            text-decoration: none;
            font-weight: 800;
          }
        `}</style>

        <div className="checkout-empty-card">
          <p className="checkout-empty-icon">🛒</p>
          <p className="checkout-empty-title">السلة فاضية</p>
          <p className="checkout-empty-copy">
            أضف منتج واحد على الأقل من المتجر، وبعدها نكمل خطوات الطلب بشكل مرتب.
          </p>
          <Link href="/store">تصفّح البرامج</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .checkout-page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 30%),
            #fafafa;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
          color: #1a1a1a;
        }

        .checkout-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          padding: 0.72rem 0.9rem;
          border-bottom: 1px solid rgba(17, 17, 17, 0.07);
          background-color: rgba(250, 250, 250, 0.92);
          backdrop-filter: blur(14px);
        }

        .checkout-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
        }

        .checkout-brand img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .checkout-brand span {
          font-size: 0.98rem;
          font-weight: 900;
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .checkout-nav-link {
          color: #555;
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .checkout-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0.95rem 0.8rem 2.4rem;
        }

        .checkout-hero {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .checkout-eyebrow {
          display: inline-flex;
          margin-bottom: 0.55rem;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          background: rgba(184, 145, 46, 0.12);
          color: #8f6a14;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .checkout-hero h1 {
          margin: 0 0 0.45rem;
          font-size: clamp(1.58rem, 5vw, 2.35rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .checkout-hero p {
          max-width: 640px;
          margin: 0;
          color: #777;
          font-size: 0.92rem;
          line-height: 1.7;
        }

        .checkout-hero-summary {
          min-width: 0;
          padding: 0.85rem 0.9rem;
          border: 1px solid rgba(184, 145, 46, 0.18);
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 16px 28px rgba(17, 17, 17, 0.05);
        }

        .checkout-hero-summary span {
          display: block;
          color: #777;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .checkout-hero-summary strong {
          display: block;
          margin-top: 0.25rem;
          font-size: 1.28rem;
          font-weight: 900;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.8rem;
          align-items: start;
        }

        .checkout-form-card,
        .checkout-summary-card,
        .checkout-loading {
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 16px 30px rgba(17, 17, 17, 0.05);
        }

        .checkout-form-card {
          padding: 1rem 0.9rem;
        }

        .checkout-loading {
          padding: 1.7rem 1.2rem;
          text-align: center;
          color: #888;
          line-height: 1.8;
        }

        .checkout-form-head {
          margin-bottom: 0.85rem;
        }

        .checkout-form-head h2 {
          margin: 0 0 0.3rem;
          font-size: 1.08rem;
          font-weight: 900;
        }

        .checkout-form-head p {
          margin: 0;
          color: #7d7d7d;
          font-size: 0.86rem;
          line-height: 1.7;
        }

        .checkout-error {
          margin-bottom: 0.9rem;
          padding: 0.75rem 0.9rem;
          border: 1px solid #fecaca;
          border-radius: 14px;
          background: #fef2f2;
          color: #dc2626;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .checkout-form {
          display: grid;
          gap: 0.85rem;
        }

        .checkout-field label {
          display: block;
          margin-bottom: 0.45rem;
          color: #333;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .checkout-field small {
          display: block;
          margin-top: 0.4rem;
          color: #959595;
          font-size: 0.74rem;
          line-height: 1.6;
        }

        .checkout-input {
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
        }

        .checkout-input:focus {
          border-color: rgba(184, 145, 46, 0.8) !important;
          box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.12);
          background-color: #fffdf8 !important;
        }

        .checkout-submit {
          width: 100%;
          min-height: 54px;
          border: none;
          border-radius: 14px;
          color: #fff;
          font-family: 'Tajawal', Arial, sans-serif;
          font-size: 0.96rem;
          font-weight: 900;
          line-height: 1.4;
          cursor: pointer;
          opacity: 1;
          transition: opacity 0.15s ease;
          box-shadow: 0 16px 26px rgba(184, 145, 46, 0.2);
        }

        .checkout-submit:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .checkout-secure {
          text-align: center;
          color: #8a8a8a;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .checkout-summary-wrap {
          position: static;
          display: grid;
          gap: 0.75rem;
        }

        .checkout-summary-card {
          overflow: hidden;
        }

        .checkout-summary-header {
          padding: 0.9rem 0.9rem 0.7rem;
        }

        .checkout-summary-header h2 {
          margin: 0 0 0.3rem;
          font-size: 1.08rem;
          font-weight: 900;
        }

        .checkout-summary-header p {
          margin: 0;
          color: #7a7a7a;
          font-size: 0.82rem;
          line-height: 1.7;
        }

        .checkout-summary-items {
          display: grid;
        }

        .checkout-summary-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: flex-start;
          gap: 0.65rem;
          padding: 0.82rem 0.9rem;
          border-top: 1px solid #f2f2f2;
        }

        .checkout-summary-item strong {
          color: #1a1a1a;
          font-size: 0.9rem;
          font-weight: 800;
          line-height: 1.55;
        }

        .checkout-summary-item span {
          color: #b8912e;
          font-size: 0.86rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .checkout-summary-item span.is-free {
          color: #16a34a;
        }

        .checkout-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem;
          background: #111;
          color: #fff;
        }

        .checkout-summary-total span {
          font-size: 0.88rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.72);
        }

        .checkout-summary-total strong {
          font-size: 1.28rem;
          font-weight: 900;
        }

        .checkout-trust {
          display: grid;
          gap: 0.6rem;
          padding: 0.9rem;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 14px 26px rgba(17, 17, 17, 0.04);
        }

        .checkout-trust-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #666;
          font-size: 0.82rem;
          font-weight: 700;
        }

        @media (min-width: 641px) {
          .checkout-nav {
            padding: 0.82rem 1.2rem;
          }

          .checkout-brand img {
            width: 46px;
            height: 46px;
          }

          .checkout-brand span {
            font-size: 1.1rem;
          }

          .checkout-nav-link {
            font-size: 0.9rem;
          }

          .checkout-main {
            padding: 1.15rem 1rem 2.8rem;
          }

          .checkout-form-card {
            padding: 1.1rem 1rem;
          }

          .checkout-summary-header,
          .checkout-summary-item,
          .checkout-summary-total,
          .checkout-trust {
            padding-inline: 1rem;
          }
        }

        @media (min-width: 861px) {
          .checkout-hero {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
            gap: 1rem;
            margin-bottom: 1.25rem;
          }

          .checkout-layout {
            grid-template-columns: minmax(0, 1.2fr) minmax(290px, 0.85fr);
            gap: 1rem;
          }

          .checkout-hero-summary {
            min-width: 220px;
          }

          .checkout-form-card {
            padding: 1.2rem;
          }

          .checkout-summary-wrap {
            position: sticky;
            top: 1rem;
            gap: 0.9rem;
          }
        }
      `}</style>

      <nav className="checkout-nav">
        <Link href="/" className="checkout-brand">
          <Image src="/logo.png" alt="المعضل" width={48} height={48} />
          <span>المعضل</span>
        </Link>
        <Link href="/cart" className="checkout-nav-link">
          ← السلة
        </Link>
      </nav>

      <main className="checkout-main">
        <section className="checkout-hero">
          <div>
            <span className="checkout-eyebrow">إتمام الطلب</span>
            <h1>خطوة أخيرة ونرسل لك كل شيء مباشرة</h1>
            <p>
              خففنا الفراغات ورتبنا النموذج والملخص بحيث تكون الصفحة ممتلئة
              بالمعلومات المهمة فقط، خصوصًا على الجوال.
            </p>
          </div>

          <div className="checkout-hero-summary">
            <span>{hydrated ? `${cart.length} برامج جاهزة` : 'جار تجهيز الطلب'}</span>
            <strong>{hydrated ? totalLabel : '...'}</strong>
          </div>
        </section>

        {!hydrated ? (
          <div className="checkout-loading">
            جار قراءة محتوى السلة وتجهيز صفحة الدفع...
          </div>
        ) : (
          <div className="checkout-layout">
            <section className="checkout-form-card">
              <div className="checkout-form-head">
                <h2>بيانات الطلب</h2>
                <p>أدخل بياناتك مرة واحدة، وسنرسل الفاتورة ورابط الوصول مباشرة إلى بريدك.</p>
              </div>

              {error && <div className="checkout-error">{error}</div>}

              <form onSubmit={handleSubmit} className="checkout-form">
                <div className="checkout-field">
                  <label htmlFor="full_name">الاسم الكامل *</label>
                  <input
                    id="full_name"
                    style={inputStyle}
                    className="checkout-input"
                    required
                    autoComplete="name"
                    placeholder="مثال: محمد أحمد"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="email">البريد الإلكتروني *</label>
                  <input
                    id="email"
                    style={inputStyle}
                    className="checkout-input"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                  <small>سيتم إرسال الفاتورة ورابط التحميل على هذا البريد.</small>
                </div>

                <div className="checkout-field">
                  <label htmlFor="phone">
                    رقم الجوال <span style={{ color: '#b6b6b6', fontWeight: 500 }}>(اختياري)</span>
                  </label>
                  <input
                    id="phone"
                    style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                    className="checkout-input"
                    type="tel"
                    autoComplete="tel"
                    placeholder="05XXXXXXXX"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="checkout-submit"
                  style={{
                    background:
                      total === 0
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : 'linear-gradient(135deg, #D4A843, #B8912E)',
                  }}
                >
                  {loading
                    ? '⏳ جاري المعالجة...'
                    : total === 0
                      ? 'حمّل الآن مجانًا'
                      : `ادفع ${total} ريال عبر PayPal`}
                </button>

                {total > 0 && <div className="checkout-secure">🔒 دفع آمن عبر PayPal</div>}
              </form>
            </section>

            <aside className="checkout-summary-wrap">
              <div className="checkout-summary-card">
                <div className="checkout-summary-header">
                  <h2>ملخص الطلب</h2>
                  <p>كل المنتجات المختارة واضحة هنا قبل ما تكمل.</p>
                </div>

                <div className="checkout-summary-items">
                  {cart.map(item => (
                    <div key={item.id} className="checkout-summary-item">
                      <strong>{item.title}</strong>
                      <span className={item.is_free ? 'is-free' : ''}>
                        {item.is_free ? 'مجاني' : `${item.price} ريال`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="checkout-summary-total">
                  <div>
                    <span>المجموع</span>
                  </div>
                  <strong>{totalLabel}</strong>
                </div>
              </div>

              <div className="checkout-trust">
                {[
                  { icon: '⚡', text: 'تحميل فوري بعد الإتمام' },
                  { icon: '📧', text: 'الفاتورة والرابط على إيميلك' },
                  { icon: '📱', text: 'يعمل على أي جهاز' },
                  { icon: '🔒', text: total === 0 ? 'بدون دفع لهذا الطلب' : 'دفع آمن عبر PayPal' },
                ].map((item, index) => (
                  <div key={index} className="checkout-trust-item">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
