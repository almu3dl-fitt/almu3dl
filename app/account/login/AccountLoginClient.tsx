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
type CooldownByEmail = Record<string, number>

type StoredLoginState = {
  deliveryEmail: string
  step: LoginStep
  cooldownByEmail: CooldownByEmail
}

function getEmptyLoginState(): StoredLoginState {
  return {
    deliveryEmail: '',
    step: 'email',
    cooldownByEmail: {},
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getCooldownByEmail(rawValue: unknown) {
  if (!rawValue || typeof rawValue !== 'object') {
    return {}
  }

  const nextCooldownByEmail: CooldownByEmail = {}

  for (const [email, cooldownUntil] of Object.entries(rawValue)) {
    if (typeof cooldownUntil !== 'number' || !Number.isFinite(cooldownUntil) || cooldownUntil <= 0) {
      continue
    }

    nextCooldownByEmail[email] = cooldownUntil
  }

  return nextCooldownByEmail
}

function getEmailCooldown(cooldownByEmail: CooldownByEmail, email: string) {
  if (!email) {
    return 0
  }

  return cooldownByEmail[email] ?? 0
}

function isRateLimitError(error: { code?: string; status?: number } | null) {
  if (!error) {
    return false
  }

  return (
    error.status === 429 ||
    error.code === 'over_request_rate_limit' ||
    error.code === 'over_email_send_rate_limit'
  )
}

function getInitialLoginState(): StoredLoginState {
  if (typeof window === 'undefined') {
    return getEmptyLoginState()
  }

  try {
    const rawState = window.sessionStorage.getItem(LOGIN_STORAGE_KEY)

    if (!rawState) {
      return getEmptyLoginState()
    }

    const parsedState = JSON.parse(rawState) as Partial<StoredLoginState>
    const deliveryEmail =
      typeof parsedState.deliveryEmail === 'string' ? parsedState.deliveryEmail : ''
    const step = parsedState.step === 'otp' && deliveryEmail ? 'otp' : 'email'
    const cooldownByEmail = getCooldownByEmail(parsedState.cooldownByEmail)

    if (step !== 'otp') {
      return getEmptyLoginState()
    }

    return {
      deliveryEmail,
      step,
      cooldownByEmail,
    }
  } catch {
    return getEmptyLoginState()
  }
}

function persistLoginState(nextState: StoredLoginState) {
  if (typeof window === 'undefined') {
    return
  }

  if (nextState.step !== 'otp' || !nextState.deliveryEmail) {
    clearLoginState()
    return
  }

  window.sessionStorage.setItem(
    LOGIN_STORAGE_KEY,
    JSON.stringify({
      deliveryEmail: nextState.deliveryEmail,
      step: 'otp',
      cooldownByEmail: {
        [nextState.deliveryEmail]: getEmailCooldown(
          nextState.cooldownByEmail,
          nextState.deliveryEmail,
        ),
      },
    } satisfies StoredLoginState),
  )
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
  const [emailInput, setEmailInput] = useState('')
  const [deliveryEmail, setDeliveryEmail] = useState(initialState.deliveryEmail)
  const [step, setStep] = useState<LoginStep>(initialState.step)
  const [cooldownByEmail, setCooldownByEmail] = useState<CooldownByEmail>(
    initialState.cooldownByEmail,
  )
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(
    initialState.step === 'otp' && initialState.deliveryEmail
      ? `أدخل رمز التحقق المرسل إلى ${initialState.deliveryEmail}.`
      : '',
  )
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const flowVersionRef = useRef(0)

  const activeEmail = useMemo(() => {
    return step === 'otp' ? deliveryEmail : ''
  }, [deliveryEmail, step])

  const activeCooldownUntil = useMemo(() => {
    return getEmailCooldown(cooldownByEmail, activeEmail)
  }, [activeEmail, cooldownByEmail])

  useEffect(() => {
    if (activeCooldownUntil <= now) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [activeCooldownUntil, now])

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
    return Math.max(0, Math.ceil((activeCooldownUntil - now) / 1000))
  }, [activeCooldownUntil, now])

  const canResend = step === 'otp' && cooldownSeconds === 0 && !sendingCode && !verifyingCode
  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otpCode[index] || '')

  const syncLoginState = (nextState: StoredLoginState) => {
    setDeliveryEmail(nextState.deliveryEmail)
    setStep(nextState.step)
    setCooldownByEmail(nextState.cooldownByEmail)
    persistLoginState(nextState)
  }

  const resetLoginFlow = () => {
    flowVersionRef.current += 1
    setEmailInput('')
    setDeliveryEmail('')
    setStep('email')
    setCooldownByEmail({})
    setOtpCode('')
    setError('')
    setNotice('')
    setSendingCode(false)
    setVerifyingCode(false)
    setNow(Date.now())
    otpInputRefs.current = []
    clearLoginState()
  }

  const moveToOtpStep = (normalizedEmail: string) => {
    const nextState = {
      deliveryEmail: normalizedEmail,
      step: 'otp' as const,
      cooldownByEmail: {
        ...cooldownByEmail,
        [normalizedEmail]: Date.now() + COOLDOWN_MS,
      },
    }

    setEmailInput(normalizedEmail)
    setOtpCode('')
    setNow(Date.now())
    syncLoginState(nextState)
  }

  const sendOtpCode = async (requestedEmail: string, mode: 'initial' | 'resend') => {
    setError('')
    setNotice('')
    setSendingCode(true)

    const normalizedEmail = normalizeEmail(requestedEmail)
    const requestVersion = flowVersionRef.current

    try {
      const { error: sendError } = await supabaseBrowser.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (requestVersion !== flowVersionRef.current) {
        return
      }

      if (sendError) {
        if (isRateLimitError(sendError)) {
          const nextCooldownByEmail = {
            ...cooldownByEmail,
            [normalizedEmail]: Date.now() + COOLDOWN_MS,
          }

          setEmailInput(normalizedEmail)
          setOtpCode('')
          setCooldownByEmail(nextCooldownByEmail)
          setNow(Date.now())
          syncLoginState({
            deliveryEmail: normalizedEmail,
            step: 'otp',
            cooldownByEmail: nextCooldownByEmail,
          })
        }

        setError(mapAuthError(sendError, 'send'))
        return
      }

      moveToOtpStep(normalizedEmail)
      setNotice(
        mode === 'initial'
          ? `أرسلنا الرمز إلى ${normalizedEmail}.`
          : `أرسلنا رمزًا جديدًا إلى ${normalizedEmail}.`,
      )
    } catch {
      if (requestVersion !== flowVersionRef.current) {
        return
      }

      setError('حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.')
    } finally {
      if (requestVersion === flowVersionRef.current) {
        setSendingCode(false)
      }
    }
  }

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const normalizedEmail = normalizeEmail(emailInput)
    const emailCooldownUntil = getEmailCooldown(cooldownByEmail, normalizedEmail)
    const emailCooldownSeconds = Math.max(0, Math.ceil((emailCooldownUntil - Date.now()) / 1000))

    if (emailCooldownSeconds > 0) {
      setError('')
      setNotice(
        `أرسلنا الرمز إلى ${normalizedEmail} بالفعل. انتظر ${emailCooldownSeconds} ثانية قبل إعادة الإرسال.`,
      )
      syncLoginState({
        deliveryEmail: normalizedEmail,
        step: 'otp',
        cooldownByEmail,
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
      resetLoginFlow()
      return
    }

    if (normalizedCode.length !== OTP_LENGTH) {
      setError('أدخل الرمز المكوّن من 6 أرقام.')
      return
    }

    setVerifyingCode(true)
    const requestVersion = flowVersionRef.current

    try {
      const {
        data: { session },
        error: verifyError,
      } = await supabaseBrowser.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedCode,
        type: 'email',
      })

      if (requestVersion !== flowVersionRef.current) {
        return
      }

      if (verifyError) {
        setError(mapAuthError(verifyError, 'verify'))
        return
      }

      if (!session) {
        setError('تعذر إنشاء الجلسة الآن. حاول مرة أخرى.')
        return
      }

      clearLoginState()
      window.location.assign('/account')
      return
    } catch {
      if (requestVersion !== flowVersionRef.current) {
        return
      }

      setError('حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.')
    } finally {
      if (requestVersion === flowVersionRef.current) {
        setVerifyingCode(false)
      }
    }
  }

  const handleChangeEmail = () => {
    resetLoginFlow()
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

        .account-login-panel {
          margin-top: 1.15rem;
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

        .account-login-success,
        .account-login-error {
          margin-top: 1rem;
          padding: 0.85rem 0.95rem;
          border-radius: 16px;
          font-size: 0.86rem;
          line-height: 1.8;
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
          <h1>تسجيل الدخول إلى حسابك</h1>
          <p>أدخل بريدك الإلكتروني لإرسال رمز الدخول.</p>

          {notice && <div className="account-login-success">{notice}</div>}
          {error && <div className="account-login-error">{error}</div>}

          {step === 'email' ? (
            <div className="account-login-panel">
              <h2>تسجيل الدخول</h2>
              <p>أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق.</p>

              <form className="account-login-form" onSubmit={handleEmailSubmit}>
                <div className="account-login-field">
                  <label htmlFor="email">البريد الإلكتروني</label>
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="customer_email"
                    type="email"
                    required
                    autoComplete="section-account-login email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="example@email.com"
                    value={emailInput}
                    onChange={event => {
                      setEmailInput(event.target.value)
                      setError('')
                      setNotice('')
                    }}
                    className="account-login-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingCode || verifyingCode}
                  className="account-login-submit"
                >
                  {sendingCode ? 'جاري إرسال الرمز...' : 'إرسال الرمز'}
                </button>
              </form>
            </div>
          ) : (
            <div className="account-login-panel">
              <h2>أدخل رمز التحقق</h2>
              <p>أرسلنا الرمز إلى بريدك الإلكتروني.</p>

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
                  <label htmlFor="otp-0">رمز التحقق</label>
                  <div
                    className="account-login-otp-group"
                    style={{ gridTemplateColumns: `repeat(${OTP_LENGTH}, minmax(0, 1fr))` }}
                  >
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
                    {verifyingCode ? 'جاري التحقق...' : 'تأكيد'}
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
                        ? 'جاري إرسال الرمز...'
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

        </section>
      </main>
    </div>
  )
}
