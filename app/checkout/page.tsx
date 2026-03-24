'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'
import { getCart, getCartTotal, type CartItem } from '@/lib/cart'
import { supabaseBrowser } from '@/lib/supabase-browser'

const CHECKOUT_PROCESSING_KEY = 'almu3dl_checkout_processing'

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasDismissedRouteError, setHasDismissedRouteError] = useState(false)
  const [processingState, setProcessingState] = useState<'idle' | 'free' | 'paypal'>(() => {
    if (typeof window === 'undefined') {
      return 'idle'
    }

    const persistedState = window.sessionStorage.getItem(CHECKOUT_PROCESSING_KEY)
    return persistedState === 'free' || persistedState === 'paypal'
      ? persistedState
      : 'idle'
  })
  const [routeState] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        cancelled: false,
        errorCode: '',
      }
    }

    const params = new URLSearchParams(window.location.search)

    return {
      cancelled: params.get('cancelled') === 'true',
      errorCode: params.get('error') || '',
    }
  })
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

  useEffect(() => {
    const hydrateCustomer = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!user?.email) {
        return
      }

      setForm(current => ({
        full_name:
          current.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          '',
        email: current.email || user.email || '',
        phone: current.phone,
      }))
    }

    void hydrateCustomer()
  }, [])

  useEffect(() => {
    if (!routeState.cancelled && !routeState.errorCode) {
      return
    }

    window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
  }, [routeState.cancelled, routeState.errorCode])

  const total = getCartTotal(cart)
  const totalLabel = total === 0 ? 'مجاني' : `${total} ريال`
  const cancelled = routeState.cancelled
  const errorCode = routeState.errorCode
  const routeErrorMessages: Record<string, string> = {
    missing_order: 'تعذر العثور على الطلب المطلوب لإكمال الدفع.',
    invalid_order: 'تعذر التحقق من الطلب الحالي. حاول إنشاء طلب جديد.',
    payment_failed: 'لم يكتمل الدفع بنجاح. يمكنك المحاولة مرة أخرى.',
    unknown: 'حدث خطأ غير متوقع أثناء تأكيد الطلب. حاول مرة أخرى.',
  }
  const routeError =
    cancelled
      ? 'تم إلغاء الدفع قبل الإتمام. سلتك ما زالت محفوظة ويمكنك المحاولة مرة أخرى.'
      : errorCode
        ? routeErrorMessages[errorCode] || 'تعذر إكمال الطلب الآن. حاول مرة أخرى.'
        : ''
  const activeRouteError = hasDismissedRouteError ? '' : routeError
  const effectiveError = error || activeRouteError
  const isProcessing = processingState !== 'idle' && !activeRouteError

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setHasDismissedRouteError(true)

    if (!form.full_name.trim()) {
      setError('ادخل اسمك الكامل')
      return
    }
    if (!isValidEmail(form.email)) {
      setError('ادخل بريد إلكتروني صحيح')
      return
    }

    const nextState = total === 0 ? 'free' : 'paypal'
    setLoading(true)
    setProcessingState(nextState)
    window.sessionStorage.setItem(CHECKOUT_PROCESSING_KEY, nextState)

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
          window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
          setProcessingState('idle')
          setLoading(false)
          return
        }
        window.location.href = `/success?order=${data.orderId}`
        return
      } catch {
        setError('حصل خطأ، حاول مرة ثانية')
      }
      window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
      setProcessingState('idle')
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
        window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
        setProcessingState('idle')
        setLoading(false)
        return
      }
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
        return
      }
      setError('تعذر بدء الدفع الآن. حاول مرة أخرى.')
    } catch {
      setError('حصل خطأ، حاول مرة ثانية')
    }
    window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
    setProcessingState('idle')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.82rem 0.95rem',
    fontSize: '0.98rem',
    border: '1px solid var(--store-border)',
    borderRadius: '16px',
    fontFamily: "'Tajawal', Arial, sans-serif",
    direction: 'rtl' as const,
    outline: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--store-text)',
  }

  if (isProcessing) {
    const isFreeFlow = processingState === 'free'

    return (
      <div className="checkout-page-shell checkout-empty-state">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

          .checkout-page-shell {
            font-family: 'Tajawal', 'Arial', sans-serif;
            direction: rtl;
          }

          .checkout-empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }

          .checkout-empty-card {
            width: min(100%, 500px);
            padding: 1.9rem 1.25rem;
            border: 1px solid var(--store-border);
            border-radius: 24px;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
              var(--store-surface);
            text-align: center;
            box-shadow: var(--store-shadow);
          }

          .checkout-empty-card p {
            margin: 0;
          }

          .checkout-empty-card .checkout-empty-icon {
            font-size: 2.8rem;
            margin-bottom: 0.75rem;
          }

          .checkout-empty-card .checkout-empty-title {
            margin-bottom: 0.45rem;
            font-size: 1.28rem;
            font-weight: 900;
          }

          .checkout-empty-card .checkout-empty-copy {
            color: var(--store-text-muted);
            line-height: 1.9;
          }

          .checkout-empty-note {
            margin-top: 1rem;
            padding: 0.8rem 0.95rem;
            border-radius: 16px;
            background: var(--store-accent-wash);
            border: 1px solid var(--store-border-strong);
            color: var(--store-accent-strong);
            font-size: 0.84rem;
            font-weight: 800;
            line-height: 1.8;
          }
        `}</style>

        <div className="checkout-empty-card">
          <p className="checkout-empty-icon">{isFreeFlow ? '⏳' : '🔐'}</p>
          <p className="checkout-empty-title">جاري معالجة طلبك...</p>
          <p className="checkout-empty-copy">
            {isFreeFlow
              ? 'جاري تأكيد طلبك المجاني وتجهيز ملفاتك للتحميل. لا تغلق الصفحة حتى ننقلك إلى صفحة النجاح.'
              : 'جاري تجهيز طلبك وتحويلك إلى بوابة الدفع الآمنة لتأكيد العملية وتجهيز ملفاتك.'}
          </p>
          <div className="checkout-empty-note">
            لا تغلق الصفحة الآن. سنكمل الخطوة التالية تلقائيًا بمجرد تأكيد العملية.
          </div>
        </div>
      </div>
    )
  }

  if (hydrated && cart.length === 0) {
    return (
      <div className="checkout-page-shell checkout-empty-state">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

          .checkout-page-shell {
            font-family: 'Tajawal', 'Arial', sans-serif;
            direction: rtl;
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
            border: 1px solid var(--store-border);
            border-radius: 20px;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
              var(--store-surface);
            text-align: center;
            box-shadow: var(--store-shadow);
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
            color: var(--store-text-muted);
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
            background: linear-gradient(135deg, #fff0bf, var(--store-accent));
            color: #111;
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
    <div className="checkout-page-shell storefront-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .checkout-page-shell {
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .checkout-main {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1.4rem 0 0;
        }

        .checkout-hero {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 1.4rem;
          border: 1px solid var(--store-border);
          border-radius: var(--store-radius-xl);
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.12), rgba(255, 255, 255, 0.02) 48%),
            var(--store-surface);
          box-shadow: var(--store-shadow);
        }

        .checkout-eyebrow {
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

        .checkout-hero h1 {
          margin: 0 0 0.45rem;
          color: var(--store-text);
          font-size: clamp(1.75rem, 5vw, 2.6rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .checkout-hero p {
          max-width: 640px;
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.92rem;
          line-height: 1.8;
        }

        .checkout-hero-summary {
          min-width: 0;
          padding: 0.9rem 1rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
        }

        .checkout-hero-summary span {
          display: block;
          color: var(--store-text-muted);
          font-size: 0.86rem;
          font-weight: 700;
        }

        .checkout-hero-summary strong {
          display: block;
          margin-top: 0.25rem;
          color: var(--store-accent-strong);
          font-size: 1.42rem;
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
          border: 1px solid var(--store-border);
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
        }

        .checkout-form-card {
          padding: 1rem 0.9rem;
        }

        .checkout-loading {
          padding: 1.7rem 1.2rem;
          text-align: center;
          color: var(--store-text-muted);
          line-height: 1.8;
        }

        .checkout-form-head {
          margin-bottom: 0.85rem;
        }

        .checkout-form-head h2 {
          margin: 0 0 0.3rem;
          color: var(--store-text);
          font-size: 1.12rem;
          font-weight: 900;
        }

        .checkout-form-head p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.86rem;
          line-height: 1.7;
        }

        .checkout-error {
          margin-bottom: 0.9rem;
          padding: 0.75rem 0.9rem;
          border: 1px solid rgba(255, 107, 107, 0.34);
          border-radius: 14px;
          background: rgba(255, 107, 107, 0.12);
          color: #ff8f8f;
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
          color: var(--store-text);
          font-size: 0.88rem;
          font-weight: 700;
        }

        .checkout-field small {
          display: block;
          margin-top: 0.4rem;
          color: var(--store-text-soft);
          font-size: 0.74rem;
          line-height: 1.6;
        }

        .checkout-input {
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
        }

        .checkout-input:focus {
          border-color: var(--store-border-strong) !important;
          box-shadow: 0 0 0 4px rgba(224, 180, 72, 0.14);
          background-color: rgba(255, 255, 255, 0.05) !important;
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
          box-shadow: 0 16px 26px rgba(224, 180, 72, 0.2);
        }

        .checkout-submit:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .checkout-secure {
          text-align: center;
          color: var(--store-text-soft);
          font-size: 0.78rem;
          font-weight: 700;
        }

        .checkout-payment-meta {
          display: grid;
          gap: 0.72rem;
        }

        .checkout-payment-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.65rem;
        }

        .checkout-payment-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          min-height: 44px;
          padding: 0.62rem 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.035);
          color: var(--store-text);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .checkout-payment-badge.is-paypal {
          border-color: rgba(255, 255, 255, 0.18);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
            rgba(255, 255, 255, 0.04);
        }

        .checkout-payment-badge svg {
          flex: none;
          width: 20px;
          height: 20px;
        }

        .checkout-payment-badge-label {
          display: grid;
          gap: 0.08rem;
          text-align: right;
          line-height: 1.15;
        }

        .checkout-payment-badge-label strong {
          color: var(--store-text);
          font-size: 0.78rem;
          font-weight: 900;
        }

        .checkout-payment-badge-label small {
          color: var(--store-text-soft);
          font-size: 0.65rem;
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
          color: var(--store-text);
          font-size: 1.08rem;
          font-weight: 900;
        }

        .checkout-summary-header p {
          margin: 0;
          color: var(--store-text-muted);
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
          border-top: 1px solid var(--store-divider);
        }

        .checkout-summary-item strong {
          color: var(--store-text);
          font-size: 0.9rem;
          font-weight: 800;
          line-height: 1.55;
        }

        .checkout-summary-item span {
          color: var(--store-accent-strong);
          font-size: 0.86rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .checkout-summary-item span.is-free {
          color: #7ce6a5;
        }

        .checkout-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.18), rgba(17, 17, 17, 0.35) 55%),
            #0d0f0d;
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
          border: 1px solid var(--store-border);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          box-shadow: var(--store-card-shadow);
        }

        .checkout-trust-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--store-text-muted);
          font-size: 0.82rem;
          font-weight: 700;
        }

        @media (min-width: 641px) {
          .checkout-main {
            padding-top: 1.4rem;
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

      <StorefrontHeader
        showCart={false}
        actions={[
          { href: '/cart', label: 'السلة', variant: 'muted' },
          { href: '/store', label: 'تسوق الآن', variant: 'primary' },
        ]}
      />

      <main className="checkout-main">
        <section className="checkout-hero">
          <div>
            <span className="checkout-eyebrow">إتمام الطلب</span>
            <h1>خطوة أخيرة ونرسل لك كل شيء مباشرة</h1>
            <p>
              نموذج مختصر، ملخص أوضح، وتأكيد بصري أعلى حتى تبدو صفحة الدفع
              احترافية وسهلة الإكمال على الجوال والكمبيوتر.
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

          {effectiveError && <div className="checkout-error">{effectiveError}</div>}

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
                        ? 'linear-gradient(135deg, #7ce6a5, #3dc26c)'
                        : 'linear-gradient(135deg, #fff0bf, var(--store-accent))',
                    color: total === 0 ? '#062612' : '#111',
                  }}
                >
                  {loading
                    ? '⏳ جاري المعالجة...'
                    : total === 0
                      ? 'ابدأ اليوم مجانًا'
                      : `ادفع ${total} ريال عبر PayPal`}
                </button>

                {total > 0 && (
                  <div className="checkout-payment-meta">
                    <div className="checkout-secure">🔒 دفع آمن عبر PayPal</div>

                    <div className="checkout-payment-badges" aria-label="خيارات الدفع عبر بايبال">
                      <div className="checkout-payment-badge is-paypal">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M8.06 19.5H4.8c-.27 0-.44-.25-.39-.5L6.8 4.1c.05-.23.24-.4.48-.4h6.13c2.1 0 3.63.44 4.54 1.31.81.77 1.15 1.87.96 3.13-.27 1.85-1.16 3.07-2.65 3.66-.69.27-.69.27-.47.96l.35 1.1c.04.14-.06.29-.21.29h-1.88c-.24 0-.45-.16-.52-.39l-.24-.8c-.14-.46-.31-.54-.79-.54H9.8c-.26 0-.48.19-.52.45l-.67 4.13c-.04.28-.28.5-.55.5Z"
                            fill="#fff"
                            fillOpacity=".9"
                          />
                          <path
                            d="M18.92 8.47c-.18 1.19-.73 2.1-1.63 2.69-.8.53-1.9.8-3.27.8H11.8c-.24 0-.44.17-.48.4l-.69 4.31-.19 1.22c-.04.23.14.44.37.44h2.78c.21 0 .4-.15.43-.36l.02-.1.52-3.28.03-.18c.03-.21.21-.36.43-.36h.27c1.73 0 3.08-.35 4.01-1.04.93-.69 1.53-1.78 1.78-3.24.1-.61.09-1.12-.03-1.54-.04.08-.09.16-.13.24Z"
                            fill="#f3c14d"
                          />
                        </svg>

                        <span className="checkout-payment-badge-label">
                          <strong>PayPal</strong>
                          <small>بوابة الدفع</small>
                        </span>
                      </div>

                      <div className="checkout-payment-badge">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect
                            x="2.5"
                            y="5"
                            width="19"
                            height="14"
                            rx="3"
                            stroke="#f3c14d"
                            strokeWidth="1.5"
                          />
                          <path d="M3.75 9.25h16.5" stroke="#f3c14d" strokeWidth="1.5" />
                          <path
                            d="M7 15.25h3.75M14.25 15.25h2.25"
                            stroke="#fff"
                            strokeOpacity=".88"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>

                        <span className="checkout-payment-badge-label">
                          <strong>بطاقة بنكية</strong>
                          <small>مرتبطة بـ PayPal</small>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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

      <StorefrontFooter note="الدفع هنا مصمم ليبدو موثوقًا ومباشرًا مع الحفاظ على كل منطق الطلب الحالي." />
    </div>
  )
}
