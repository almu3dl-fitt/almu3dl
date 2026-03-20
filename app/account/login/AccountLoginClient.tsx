'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

const LOGIN_STORAGE_KEY = 'almu3dl_account_login_state'
const COOLDOWN_MS = 60_000
const OTP_LENGTH = 6
const OTP_VALIDITY_MINUTES = 60

type LoginStep = 'email' | 'otp'

type StoredLoginState = {
  deliveryEmail: string
  step: LoginStep
  cooldownUntil: number
}

function getInitialLoginState(): StoredLoginState {
  if (typeof window === 'undefined') {
    return {
      deliveryEmail: '',
      step: 'email',
      cooldownUntil: 0,
    }
  }

  try {
    const rawState = window.sessionStorage.getItem(LOGIN_STORAGE_KEY)

    if (!rawState) {
      return {
        deliveryEmail: '',
        step: 'email',
        cooldownUntil: 0,
      }
    }

    const parsedState = JSON.parse(rawState) as Partial<StoredLoginState>
    const deliveryEmail =
      typeof parsedState.deliveryEmail === 'string' ? parsedState.deliveryEmail : ''
    const step = parsedState.step === 'otp' && deliveryEmail ? 'otp' : 'email'
    const cooldownUntil =
      typeof parsedState.cooldownUntil === 'number' ? parsedState.cooldownUntil : 0

    return {
      deliveryEmail,
      step,
      cooldownUntil,
    }
  } catch {
    return {
      deliveryEmail: '',
      step: 'email',
      cooldownUntil: 0,
    }
  }
}

function persistLoginState(nextState: StoredLoginState) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(nextState))
}

function clearLoginState() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(LOGIN_STORAGE_KEY)
}

function mapAuthError(
  error: { code?: string; status?: number; message?: string } | null,
  phase: 'send' | 'verify',
) {
  if (!error) {
    return 'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.'
  }

  const code = error.code || ''
  const message = (error.message || '').toLowerCase()

  if (
    error.status === 429 ||
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit'
  ) {
    return 'تم تجاوز الحد المؤقت لإرسال الرموز، حاول بعد 60 ثانية تقريبًا.'
  }

  if (phase === 'send') {
    if (code === 'email_address_invalid' || message.includes('email')) {
      return 'تعذر إرسال الرمز إلى هذا البريد. تأكد من كتابته بشكل صحيح.'
    }

    if (code === 'email_provider_disabled') {
      return 'تسجيل الدخول عبر البريد غير مفعّل حاليًا في إعدادات المشروع.'
    }
  }

  if (phase === 'verify') {
    if (
      code === 'otp_expired' ||
      code === 'invalid_credentials' ||
      message.includes('expired') ||
      message.includes('invalid') ||
      message.includes('token')
    ) {
      return 'الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا ثم حاول مرة أخرى.'
    }
  }

  return 'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.'
}

export default function AccountLoginClient() {
  const [initialState] = useState<StoredLoginState>(() => getInitialLoginState())
  const [emailInput, setEmailInput] = useState(initialState.deliveryEmail)
  const [deliveryEmail, setDeliveryEmail] = useState(initialState.deliveryEmail)
  const [step, setStep] = useState<LoginStep>(initialState.step)
  const [cooldownUntil, setCooldownUntil] = useState(initialState.cooldownUntil)
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(
    initialState.step === 'otp' && initialState.deliveryEmail
      ? `أرسلنا رمز الدخول إلى ${initialState.deliveryEmail}. أدخل الرمز المكوّن من 6 أرقام واستخدم آخر رمز تم إرساله فقط.`
      : '',
  )
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (cooldownUntil <= now) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [cooldownUntil, now])

  useEffect(() => {
    if (step === 'email') {
      emailInputRef.current?.focus()
      return
    }

    const focusIndex = Math.min(otpCode.length, OTP_LENGTH - 1)

    window.requestAnimationFrame(() => {
      otpInputRefs.current[focusIndex]?.focus()
    })
  }, [otpCode.length, step])

  const cooldownSeconds = useMemo(() => {
    return Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  }, [cooldownUntil, now])

  const canResend = step === 'otp' && cooldownSeconds === 0 && !sendingCode && !verifyingCode
  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otpCode[index] || '')

  const updateLoginStep = (nextState: StoredLoginState) => {
    setDeliveryEmail(nextState.deliveryEmail)
    setStep(nextState.step)
    setCooldownUntil(nextState.cooldownUntil)
    persistLoginState(nextState)
  }

  const moveToOtpStep = (normalizedEmail: string) => {
    const nextState = {
      deliveryEmail: normalizedEmail,
      step: 'otp' as const,
      cooldownUntil: Date.now() + COOLDOWN_MS,
    }

    setEmailInput(normalizedEmail)
    setOtpCode('')
    setNow(Date.now())
    updateLoginStep(nextState)
  }

  const sendOtpCode = async (requestedEmail: string, mode: 'initial' | 'resend') => {
    setError('')
    setNotice('')
    setSendingCode(true)

    const normalizedEmail = requestedEmail.trim().toLowerCase()

    try {
      const { error: sendError } = await supabaseBrowser.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (sendError) {
        setError(mapAuthError(sendError, 'send'))
        setSendingCode(false)
        return
      }

      moveToOtpStep(normalizedEmail)
      setNotice(
        mode === 'initial'
          ? `أرسلنا رمز الدخول إلى ${normalizedEmail}. أدخل الرمز المكوّن من 6 أرقام واستخدم آخر رمز تم إرساله فقط.`
          : `أرسلنا رمزًا جديدًا إلى ${normalizedEmail}. استخدم آخر رمز تم إرساله فقط.`,
      )
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.')
    }

    setSendingCode(false)
  }

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const normalizedEmail = emailInput.trim().toLowerCase()

    if (cooldownSeconds > 0 && normalizedEmail && normalizedEmail === deliveryEmail) {
      setError('')
      setNotice(
        `أرسلنا رمز الدخول إلى ${normalizedEmail} بالفعل. انتظر ${cooldownSeconds} ثانية قبل طلب رمز جديد.`,
      )
      updateLoginStep({
        deliveryEmail: normalizedEmail,
        step: 'otp',
        cooldownUntil,
      })
      return
    }

    await sendOtpCode(emailInput, 'initial')
  }

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, '').slice(-1)
    const digits = [...otpDigits]
    digits[index] = digit
    const nextCode = digits.join('')

    setOtpCode(nextCode)
    setError('')

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
      return
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus()
      return
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()

    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)

    if (!pastedCode) {
      return
    }

    setOtpCode(pastedCode)
    setError('')

    const focusIndex = Math.min(pastedCode.length, OTP_LENGTH - 1)
    otpInputRefs.current[focusIndex]?.focus()
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')

    const normalizedEmail = deliveryEmail.trim().toLowerCase()
    const normalizedCode = otpCode.replace(/\D/g, '').slice(0, OTP_LENGTH)

    if (!normalizedEmail) {
      setError('أدخل بريدك الإلكتروني أولًا.')
      updateLoginStep({
        deliveryEmail: '',
        step: 'email',
        cooldownUntil: 0,
      })
      return
    }

    if (normalizedCode.length !== OTP_LENGTH) {
      setError('أدخل الرمز المكوّن من 6 أرقام.')
      return
    }

    setVerifyingCode(true)

    try {
      const {
        data: { session },
        error: verifyError,
      } = await supabaseBrowser.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedCode,
        type: 'email',
      })

      if (verifyError) {
        setError(mapAuthError(verifyError, 'verify'))
        setVerifyingCode(false)
        return
      }

      if (!session) {
        setError('تعذر إنشاء الجلسة الآن. حاول مرة أخرى.')
        setVerifyingCode(false)
        return
      }

      clearLoginState()
      window.location.assign('/account')
      return
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.')
    }

    setVerifyingCode(false)
  }

  const handleChangeEmail = () => {
    setOtpCode('')
    setError('')
    setNotice('')
    updateLoginStep({
      deliveryEmail: '',
      step: 'email',
      cooldownUntil: 0,
    })
    clearLoginState()
  }

  const handleResendCode = async () => {
    if (!canResend) {
      return
    }

    await sendOtpCode(deliveryEmail, 'resend')
  }

  return (
    <div className="account-login-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .account-login-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 28%),
            #fafafa;
          color: #1a1a1a;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .account-login-nav {
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

        .account-login-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
        }

        .account-login-brand span {
          font-size: 1.16rem;
          font-weight: 900;
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .account-login-nav-link {
          color: #555;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .account-login-main {
          display: grid;
          place-items: center;
          min-height: calc(100vh - 82px);
          padding: 1.2rem;
        }

        .account-login-card {
          width: min(100%, 560px);
          padding: 1.3rem 1rem;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 34px rgba(17, 17, 17, 0.05);
        }

        .account-login-eyebrow {
          display: inline-flex;
          margin-bottom: 0.7rem;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          background: rgba(184, 145, 46, 0.12);
          color: #8f6a14;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .account-login-card h1 {
          margin: 0 0 0.45rem;
          font-size: clamp(1.7rem, 4vw, 2.25rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .account-login-card p {
          margin: 0;
          color: #787878;
          font-size: 0.95rem;
          line-height: 1.8;
        }

        .account-login-steps {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.7rem;
          margin-top: 1.1rem;
        }

        .account-login-step {
          padding: 0.78rem 0.85rem;
          border-radius: 16px;
          border: 1px solid #ececec;
          background: #fff;
        }

        .account-login-step strong {
          display: block;
          margin-bottom: 0.2rem;
          font-size: 0.9rem;
          font-weight: 900;
          color: #1a1a1a;
        }

        .account-login-step span {
          color: #8a8a8a;
          font-size: 0.78rem;
          line-height: 1.7;
        }

        .account-login-step.is-active {
          border-color: #f0ddb0;
          background: #fff8e7;
        }

        .account-login-step.is-active strong,
        .account-login-step.is-active span {
          color: #8f6a14;
        }

        .account-login-panel {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 20px;
          border: 1px solid rgba(184, 145, 46, 0.12);
          background: linear-gradient(180deg, #fff, #fcfbf8);
        }

        .account-login-panel h2 {
          margin: 0 0 0.35rem;
          font-size: 1.08rem;
          font-weight: 900;
          color: #1a1a1a;
        }

        .account-login-panel p {
          color: #767676;
          font-size: 0.88rem;
          line-height: 1.8;
        }

        .account-login-note,
        .account-login-success,
        .account-login-error {
          margin-top: 1rem;
          padding: 0.85rem 0.95rem;
          border-radius: 16px;
          font-size: 0.86rem;
          line-height: 1.8;
        }

        .account-login-note {
          border: 1px solid #f0ddb0;
          background: #fff8e7;
          color: #8f6a14;
        }

        .account-login-success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #15803d;
        }

        .account-login-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #dc2626;
        }

        .account-login-form {
          display: grid;
          gap: 0.9rem;
          margin-top: 1rem;
        }

        .account-login-field label {
          display: block;
          margin-bottom: 0.45rem;
          color: #333;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .account-login-input {
          width: 100%;
          padding: 0.9rem 0.95rem;
          border: 1px solid #ddd;
          border-radius: 14px;
          background: #fff;
          font-size: 0.98rem;
          font-family: 'Tajawal', Arial, sans-serif;
          direction: rtl;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .account-login-input:focus {
          border-color: rgba(184, 145, 46, 0.8);
          box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.12);
        }

        .account-login-otp-group {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 0.55rem;
          direction: ltr;
        }

        .account-login-otp-input {
          width: 100%;
          min-height: 58px;
          border: 1px solid #ddd;
          border-radius: 16px;
          background: #fff;
          color: #1a1a1a;
          text-align: center;
          font-size: 1.3rem;
          font-weight: 900;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }

        .account-login-otp-input:focus {
          border-color: rgba(184, 145, 46, 0.8);
          box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.12);
          transform: translateY(-1px);
        }

        .account-login-meta {
          display: grid;
          gap: 0.55rem;
          padding: 0.85rem 0.95rem;
          border-radius: 16px;
          background: #fff;
          border: 1px solid #f0f0f0;
        }

        .account-login-meta strong {
          color: #1a1a1a;
          font-size: 0.92rem;
          font-weight: 900;
          word-break: break-word;
        }

        .account-login-meta span {
          color: #7d7d7d;
          font-size: 0.8rem;
          line-height: 1.8;
        }

        .account-login-validity {
          display: grid;
          gap: 0.25rem;
          padding: 0.85rem 0.95rem;
          border-radius: 16px;
          background: #fff8e7;
          border: 1px solid #f0ddb0;
          color: #8f6a14;
          font-size: 0.82rem;
          line-height: 1.8;
          font-weight: 800;
        }

        .account-login-submit,
        .account-login-secondary {
          min-height: 52px;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 900;
          font-family: 'Tajawal', Arial, sans-serif;
          cursor: pointer;
        }

        .account-login-submit {
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
          box-shadow: 0 16px 24px rgba(184, 145, 46, 0.22);
        }

        .account-login-secondary {
          background: #fff;
          border: 1px solid #e8e8e8;
          color: #555;
        }

        .account-login-submit:disabled,
        .account-login-secondary:disabled {
          cursor: not-allowed;
          opacity: 0.72;
        }

        .account-login-actions {
          display: grid;
          gap: 0.7rem;
        }

        .account-login-help {
          margin-top: 1rem;
          color: #969696;
          font-size: 0.8rem;
          text-align: center;
        }

        @media (max-width: 640px) {
          .account-login-nav {
            gap: 0.6rem;
            padding: 0.72rem 0.9rem;
          }

          .account-login-brand span {
            font-size: 0.98rem;
          }

          .account-login-nav-link {
            font-size: 0.82rem;
          }

          .account-login-main {
            padding: 0.9rem;
          }

          .account-login-card {
            padding: 1.05rem 0.9rem;
            border-radius: 20px;
          }

          .account-login-card p {
            font-size: 0.9rem;
          }

          .account-login-steps {
            grid-template-columns: 1fr;
          }

          .account-login-otp-group {
            gap: 0.4rem;
          }

          .account-login-otp-input {
            min-height: 52px;
            font-size: 1.1rem;
          }
        }
      `}</style>

      <nav className="account-login-nav">
        <Link href="/" className="account-login-brand">
          <Image src="/logo.png" alt="المعضل" width={48} height={48} />
          <span>المعضل</span>
        </Link>

        <Link href="/store" className="account-login-nav-link">
          ← المتجر
        </Link>
      </nav>

      <main className="account-login-main">
        <section className="account-login-card">
          <span className="account-login-eyebrow">حساب العميل</span>
          <h1>ادخل إلى مشترياتك السابقة</h1>
          <p>
            استخدم نفس البريد الإلكتروني الذي طلبت به من قبل، وسنرسل لك رمز دخول
            لمرة واحدة بدل الاعتماد على روابط البريد.
          </p>

          <div className="account-login-steps">
            <div className={`account-login-step ${step === 'email' ? 'is-active' : ''}`}>
              <strong>1. إدخال البريد</strong>
              <span>أدخل بريدك لنرسل لك رمز الدخول.</span>
            </div>
            <div className={`account-login-step ${step === 'otp' ? 'is-active' : ''}`}>
              <strong>2. إدخال الرمز</strong>
              <span>أدخل الرمز المكوّن من 6 أرقام لإكمال تسجيل الدخول.</span>
            </div>
          </div>

          <div className="account-login-note">
            ربط الطلبات في هذه المرحلة يعتمد على تطابق البريد الإلكتروني مع
            <strong> customer_email </strong>
            الموجود في الطلبات السابقة.
          </div>

          {notice && <div className="account-login-success">{notice}</div>}
          {error && <div className="account-login-error">{error}</div>}

          {step === 'email' ? (
            <div className="account-login-panel">
              <h2>أدخل بريدك الإلكتروني</h2>
              <p>سنرسل لك رمزًا مكوّنًا من 6 أرقام لتسجيل الدخول إلى حسابك.</p>

              <form className="account-login-form" onSubmit={handleEmailSubmit}>
                <div className="account-login-field">
                  <label htmlFor="email">البريد الإلكتروني</label>
                  <input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="example@email.com"
                    value={emailInput}
                    onChange={event => setEmailInput(event.target.value)}
                    className="account-login-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingCode || verifyingCode}
                  className="account-login-submit"
                >
                  {sendingCode ? '⏳ جاري إرسال الرمز...' : 'أرسل رمز الدخول'}
                </button>
              </form>
            </div>
          ) : (
            <div className="account-login-panel">
              <h2>أدخل رمز الدخول</h2>
              <p>أرسلنا رمزًا إلى بريدك الإلكتروني. أدخل الرمز لإكمال تسجيل الدخول.</p>

              <div className="account-login-meta">
                <strong>{deliveryEmail}</strong>
                <span>تحقق من البريد غير الهام إذا لم تجد الرسالة.</span>
              </div>

              <div className="account-login-validity">
                <span>رمز الدخول صالح لمدة {OTP_VALIDITY_MINUTES} دقيقة.</span>
                <span>استخدم آخر رمز تم إرساله فقط.</span>
              </div>

              <form className="account-login-form" onSubmit={handleVerifyOtp}>
                <div className="account-login-field">
                  <label htmlFor="otp-0">رمز الدخول</label>
                  <div className="account-login-otp-group">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={element => {
                          otpInputRefs.current[index] = element
                        }}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        value={digit}
                        onChange={event => handleOtpDigitChange(index, event.target.value)}
                        onKeyDown={event => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        className="account-login-otp-input"
                        aria-label={`خانة الرمز رقم ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="account-login-actions">
                  <button
                    type="submit"
                    disabled={sendingCode || verifyingCode}
                    className="account-login-submit"
                  >
                    {verifyingCode ? '⏳ جاري التحقق من الرمز...' : 'تأكيد الدخول'}
                  </button>

                  <button
                    type="button"
                    disabled={!canResend}
                    onClick={handleResendCode}
                    className="account-login-secondary"
                  >
                    {cooldownSeconds > 0
                      ? `إعادة إرسال الرمز خلال ${cooldownSeconds} ثانية`
                      : sendingCode
                        ? '⏳ جاري إرسال الرمز...'
                        : 'إعادة إرسال الرمز'}
                  </button>

                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="account-login-secondary"
                  >
                    تغيير البريد الإلكتروني
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="account-login-help">
            إذا طلبت أكثر من رمز، استخدم آخر رمز تم إرساله فقط. وإذا كنت قد استخدمت
            أكثر من بريد في الطلبات، فكل بريد سيعرض مشترياته الخاصة فقط.
          </p>
        </section>
      </main>
    </div>
  )
}
