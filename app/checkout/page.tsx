'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'
import { getCart, getCartTotal, type CartItem } from '@/lib/cart'
import { formatPayPalAmountLabel } from '@/lib/paypal-currency'
import { supabaseBrowser } from '@/lib/supabase-browser'

const CHECKOUT_PROCESSING_KEY = 'almu3dl_checkout_processing'

type PayPalConfigResponse = {
  clientId: string
  currency: string
  intent: string
  mode: 'live' | 'sandbox'
}

type CreateOrderResponse = {
  approvalUrl?: string
  orderId?: string
  paypalOrderId?: string
  error?: string
}

type CaptureOrderResponse = {
  redirectTo?: string
  success?: boolean
  error?: string
}

type PayPalButtonsConfig = {
  fundingSource: string
  style: {
    layout: 'vertical'
    color: 'gold' | 'black'
    shape: 'pill'
    label?: 'paypal'
    height: number
  }
  createOrder: () => Promise<string>
  onApprove: (data: { orderID?: string }) => Promise<void>
  onCancel: () => void
  onError: (error: unknown) => void
}

type PayPalButtonsInstance = {
  isEligible: () => boolean
  render: (container: HTMLDivElement) => Promise<void>
}

type PayPalNamespace = {
  FUNDING: {
    PAYPAL: string
    CARD: string
  }
  Buttons: (config: PayPalButtonsConfig) => PayPalButtonsInstance
}

declare global {
  interface Window {
    paypal?: PayPalNamespace
  }
}

async function loadPayPalSdk(clientId: string, currency: string) {
  const params = new URLSearchParams({
    'client-id': clientId,
    currency,
    intent: 'capture',
    components: 'buttons,funding-eligibility',
    'enable-funding': 'card',
    commit: 'true',
  })

  const src = `https://www.paypal.com/sdk/js?${params.toString()}`
  const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]')

  if (existingScript) {
    if (existingScript.src === src && window.paypal) {
      return
    }

    existingScript.remove()
    delete window.paypal
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.paypalSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('تعذر تحميل PayPal SDK'))
    document.body.appendChild(script)
  })
}

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
  const [paypalSdkStatus, setPaypalSdkStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [hasCardButton, setHasCardButton] = useState(false)
  const [hasPayPalButton, setHasPayPalButton] = useState(false)
  const paypalButtonRef = useRef<HTMLDivElement | null>(null)
  const cardButtonRef = useRef<HTMLDivElement | null>(null)
  const paymentOptionsRef = useRef<HTMLDivElement | null>(null)
  const orderIdByPayPalOrderIdRef = useRef<Record<string, string>>({})
  const checkoutContextRef = useRef({
    form,
    cart,
    total: 0,
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
  const paypalEquivalentLabel = total === 0 ? '' : formatPayPalAmountLabel(total)
  const cancelled = routeState.cancelled
  const errorCode = routeState.errorCode
  const routeErrorMessages: Record<string, string> = {
    missing_order: 'تعذر العثور على الطلب المطلوب لإكمال الدفع.',
    invalid_order: 'تعذر التحقق من الطلب الحالي. حاول إنشاء طلب جديد.',
    payment_failed: 'لم يكتمل الدفع بنجاح. يمكنك المحاولة مرة أخرى.',
    instrument_declined: 'تم رفض البطاقة أو وسيلة الدفع من PayPal. جرّب بطاقة أخرى أو أعد المحاولة.',
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
  const isProcessing =
    !activeRouteError &&
    (processingState === 'free' || (processingState === 'paypal' && loading))

  useEffect(() => {
    checkoutContextRef.current = {
      form,
      cart,
      total,
    }
  }, [form, cart, total])

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  }

  const clearPaidProcessingState = useEffectEvent(() => {
    window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
    setProcessingState('idle')
    setLoading(false)
  })

  const validateCheckoutForm = () => {
    const { form: currentForm } = checkoutContextRef.current

    if (!currentForm.full_name.trim()) {
      return 'ادخل اسمك الكامل'
    }

    if (!isValidEmail(currentForm.email)) {
      return 'ادخل بريد إلكتروني صحيح'
    }

    return ''
  }

  const createPaidOrder = useEffectEvent(async () => {
    const validationError = validateCheckoutForm()

    if (validationError) {
      setError(validationError)
      throw new Error(validationError)
    }

    const { form: currentForm, cart: currentCart, total: currentTotal } = checkoutContextRef.current

    setError('')
    setHasDismissedRouteError(true)
    setLoading(true)

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentForm.email,
          full_name: currentForm.full_name,
          phone: currentForm.phone || null,
          items: currentCart.map(item => ({ id: item.id, price: item.price })),
          total: currentTotal,
        }),
      })

      const data = (await res.json()) as CreateOrderResponse

      if (!res.ok || !data.orderId || !data.paypalOrderId) {
        const message = data.error || 'تعذر بدء الدفع الآن. حاول مرة أخرى.'
        setError(message)
        clearPaidProcessingState()
        throw new Error(message)
      }

      orderIdByPayPalOrderIdRef.current[data.paypalOrderId] = data.orderId
      setLoading(false)
      return data.paypalOrderId
    } catch (createError) {
      clearPaidProcessingState()
      throw createError
    }
  })

  const capturePaidOrder = useEffectEvent(async (paypalOrderId: string) => {
    const orderId = orderIdByPayPalOrderIdRef.current[paypalOrderId]

    if (!orderId) {
      const message = 'تعذر التحقق من الطلب الحالي. حاول مرة أخرى.'
      setError(message)
      clearPaidProcessingState()
      throw new Error(message)
    }

    setLoading(true)
    setProcessingState('paypal')
    window.sessionStorage.setItem(CHECKOUT_PROCESSING_KEY, 'paypal')

    try {
      const res = await fetch('/api/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      const data = (await res.json()) as CaptureOrderResponse

      if (!res.ok || !data.redirectTo) {
        const message = data.error || 'لم يكتمل الدفع بنجاح. يمكنك المحاولة مرة أخرى.'
        setError(message)
        clearPaidProcessingState()
        throw new Error(message)
      }

      window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
      setProcessingState('idle')
      setLoading(false)
      window.location.href = data.redirectTo
    } catch (captureError) {
      clearPaidProcessingState()
      throw captureError
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setHasDismissedRouteError(true)
    const validationError = validateCheckoutForm()

    if (validationError) {
      setError(validationError)
      return
    }

    // لو كل المنتجات مجانية
    if (total === 0) {
      setLoading(true)
      setProcessingState('free')
      window.sessionStorage.setItem(CHECKOUT_PROCESSING_KEY, 'free')

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

    paymentOptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  useEffect(() => {
    if (!hydrated || total === 0) {
      setPaypalSdkStatus('idle')
      setHasPayPalButton(false)
      setHasCardButton(false)
      return
    }

    let isActive = true
    const paypalContainer = paypalButtonRef.current
    const cardContainer = cardButtonRef.current

    const renderButtons = async () => {
      setPaypalSdkStatus('loading')
      setHasPayPalButton(false)
      setHasCardButton(false)

      if (paypalContainer) {
        paypalContainer.innerHTML = ''
      }

      if (cardContainer) {
        cardContainer.innerHTML = ''
      }

      try {
        const configRes = await fetch('/api/paypal-config')
        const config = (await configRes.json()) as PayPalConfigResponse & { error?: string }

        if (!configRes.ok || !config.clientId) {
          throw new Error(config.error || 'تعذر تحميل إعدادات PayPal')
        }

        await loadPayPalSdk(config.clientId, config.currency)

        if (!isActive || !window.paypal) {
          return
        }

        const fundingSources = [
          {
            source: window.paypal.FUNDING.PAYPAL,
            container: paypalContainer,
            markRendered: () => setHasPayPalButton(true),
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'pill',
              label: 'paypal',
              height: 50,
            } satisfies PayPalButtonsConfig['style'],
          },
          {
            source: window.paypal.FUNDING.CARD,
            container: cardContainer,
            markRendered: () => setHasCardButton(true),
            style: {
              layout: 'vertical',
              color: 'black',
              shape: 'pill',
              height: 50,
            } satisfies PayPalButtonsConfig['style'],
          },
        ]

        let renderedAtLeastOneButton = false

        for (const item of fundingSources) {
          const container = item.container

          if (!container) {
            continue
          }

          const button = window.paypal.Buttons({
            fundingSource: item.source,
            style: item.style,
            createOrder: async () => {
              return await createPaidOrder()
            },
            onApprove: async (data: { orderID?: string }) => {
              if (!data.orderID) {
                const message = 'تعذر تأكيد الطلب الحالي. حاول مرة أخرى.'
                setError(message)
                clearPaidProcessingState()
                return
              }

              try {
                await capturePaidOrder(data.orderID)
              } catch (approveError) {
                console.error('PayPal approve error:', approveError)
              }
            },
            onCancel: () => {
              setError('تم إلغاء الدفع قبل الإتمام. يمكنك المحاولة مرة أخرى.')
              clearPaidProcessingState()
            },
            onError: (paypalError: unknown) => {
              console.error('PayPal Buttons error:', paypalError)
              setError('تعذر إكمال الدفع الآن. حاول مرة أخرى.')
              clearPaidProcessingState()
            },
          })

          if (!button.isEligible()) {
            container.innerHTML = ''
            continue
          }

          await button.render(container)

          if (!isActive) {
            return
          }

          renderedAtLeastOneButton = true
          item.markRendered()
        }

        if (!isActive) {
          return
        }

        setPaypalSdkStatus(renderedAtLeastOneButton ? 'ready' : 'error')
      } catch (paypalSdkError) {
        console.error('PayPal SDK load error:', paypalSdkError)

        if (!isActive) {
          return
        }

        setPaypalSdkStatus('error')
        setHasPayPalButton(false)
        setHasCardButton(false)
      }
    }

    void renderButtons()

    return () => {
      isActive = false

      if (paypalContainer) {
        paypalContainer.innerHTML = ''
      }

      if (cardContainer) {
        cardContainer.innerHTML = ''
      }
    }
  }, [hydrated, total])

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
          gap: 0.78rem;
        }

        .checkout-payment-options {
          display: grid;
          gap: 0.78rem;
        }

        .checkout-payment-option {
          display: grid;
          gap: 0.45rem;
        }

        .checkout-payment-option.is-hidden {
          display: none;
        }

        .checkout-payment-option-label {
          color: var(--store-text-soft);
          font-size: 0.74rem;
          font-weight: 800;
          text-align: center;
        }

        .checkout-paypal-button-slot {
          min-height: 50px;
        }

        .checkout-paypal-button-slot.is-hidden {
          display: none;
        }

        .checkout-payment-loading,
        .checkout-payment-help,
        .checkout-payment-fallback {
          text-align: center;
          color: var(--store-text-soft);
          font-size: 0.76rem;
          font-weight: 700;
        }

        .checkout-payment-currency {
          text-align: center;
          color: var(--store-text-muted);
          font-size: 0.74rem;
          line-height: 1.8;
        }

        .checkout-payment-fallback {
          color: #ffb4b4;
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
              أدخل بياناتك لإتمام الطلب، وبعد نجاح الدفع ستصلك الفاتورة وروابط
              الوصول مباشرة.
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
                  disabled={loading || (total > 0 && paypalSdkStatus === 'loading')}
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
                      : paypalSdkStatus === 'loading'
                        ? 'جار تجهيز خيارات الدفع...'
                        : 'اختر طريقة الدفع'}
                </button>

                {total > 0 && (
                  <div className="checkout-payment-meta" ref={paymentOptionsRef}>
                    <div className="checkout-secure">🔒 دفع آمن عبر PayPal</div>
                    <div className="checkout-payment-currency">
                      سيتم خصم {paypalEquivalentLabel} عبر PayPal بما يعادل {total} ريال سعودي.
                    </div>

                    <div className="checkout-payment-options" aria-label="خيارات الدفع عبر بايبال">
                      <div className={`checkout-payment-option ${!hasPayPalButton ? 'is-hidden' : ''}`}>
                        <div className="checkout-payment-option-label">الدفع عبر PayPal</div>
                        <div
                          ref={paypalButtonRef}
                          className={`checkout-paypal-button-slot ${!hasPayPalButton ? 'is-hidden' : ''}`}
                        />
                      </div>

                      <div className={`checkout-payment-option ${!hasCardButton ? 'is-hidden' : ''}`}>
                        <div className="checkout-payment-option-label">الدفع بالبطاقة</div>
                        <div
                          ref={cardButtonRef}
                          className={`checkout-paypal-button-slot ${!hasCardButton ? 'is-hidden' : ''}`}
                        />
                      </div>
                    </div>

                    {paypalSdkStatus === 'loading' && (
                      <div className="checkout-payment-loading">جار تجهيز خيارات الدفع...</div>
                    )}

                    {paypalSdkStatus === 'ready' && !hasCardButton && (
                      <div className="checkout-payment-help">
                        إذا لم يظهر زر البطاقة، فهذا يعني أن PayPal لم يفعّل هذا الخيار لهذه الجلسة أو لهذا
                        الحساب.
                      </div>
                    )}

                    {paypalSdkStatus === 'error' && (
                      <div className="checkout-payment-fallback">
                        تعذر تحميل أزرار PayPal الآن. حدّث الصفحة ثم حاول مرة أخرى.
                      </div>
                    )}
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

      <StorefrontFooter note="بعد نجاح الطلب ستصلك الفاتورة وروابط الوصول مباشرة إلى بريدك." />
    </div>
  )
}
