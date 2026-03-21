'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

const LOGIN_STORAGE_KEY = 'almu3dl_account_login_state'
const COOLDOWN_MS = 60_000
const OTP_LENGTH = 8
const OTP_VALIDITY_MINUTES = 60
const OTP_VALIDITY_MS = OTP_VALIDITY_MINUTES * 60_000

type LoginState = 'EMAIL_ENTRY' | 'SENDING_CODE' | 'OTP_ACTIVE' | 'VERIFYING_OTP'
type OtpBannerTone = 'success' | 'notice'

type OtpChallenge = {
  email: string
  resendAvailableAt: number
  expiresAt: number
}

type OtpBanner = {
  tone: OtpBannerTone
  message: string
}

type RequestCodeResponse = {
  ok?: boolean
  error?: string
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getSecondsUntil(timestamp: number, baseTime = Date.now()) {
  return Math.max(0, Math.ceil((timestamp - baseTime) / 1000))
}

function isRateLimitError(error: { code?: string; status?: number } | null) {
  if (!error) {
    return false
  }

  const message = String((error as { message?: string }).message || '').toLowerCase()

  return (
    error.status === 429 ||
    error.code === 'over_request_rate_limit' ||
    error.code === 'over_email_send_rate_limit' ||
    message.includes('too many requests') ||
    message.includes('max frequency') ||
    message.includes('rate limit') ||
    message.includes('email rate limit exceeded')
  )
}

function isStoredChallenge(rawValue: unknown): rawValue is OtpChallenge {
  if (!rawValue || typeof rawValue !== 'object') {
    return false
  }

  const challenge = rawValue as Partial<OtpChallenge>

  return (
    typeof challenge.email === 'string' &&
    challenge.email.length > 0 &&
    typeof challenge.resendAvailableAt === 'number' &&
    Number.isFinite(challenge.resendAvailableAt) &&
    typeof challenge.expiresAt === 'number' &&
    Number.isFinite(challenge.expiresAt)
  )
}

function isValidChallenge(rawValue: unknown, now = Date.now()): rawValue is OtpChallenge {
  return isStoredChallenge(rawValue) && rawValue.expiresAt > now
}

function getStoredChallenge() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.sessionStorage.getItem(LOGIN_STORAGE_KEY)

    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue) as unknown

    if (!isStoredChallenge(parsedValue)) {
      window.sessionStorage.removeItem(LOGIN_STORAGE_KEY)
      return null
    }

    return parsedValue
  } catch {
    window.sessionStorage.removeItem(LOGIN_STORAGE_KEY)
    return null
  }
}

function persistChallenge(challenge: OtpChallenge | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!challenge) {
    window.sessionStorage.removeItem(LOGIN_STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(challenge))
}

function clearStoredChallenge() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(LOGIN_STORAGE_KEY)
}

function createChallenge(email: string, baseTime = Date.now()): OtpChallenge {
  return {
    email,
    resendAvailableAt: baseTime + COOLDOWN_MS,
    expiresAt: baseTime + OTP_VALIDITY_MS,
  }
}

function extendChallengeCooldown(challenge: OtpChallenge, baseTime = Date.now()): OtpChallenge {
  return {
    ...challenge,
    resendAvailableAt: baseTime + COOLDOWN_MS,
  }
}

function mapSendError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return 'حدث خطأ أثناء إرسال الرمز، حاول مرة أخرى.'
  }

  const code = error.code || ''
  const message = (error.message || '').toLowerCase()

  if (code === 'email_provider_disabled') {
    return 'تسجيل الدخول عبر البريد غير مفعّل حاليًا في إعدادات المشروع.'
  }

  if (isRateLimitError(error)) {
    return 'تم تجاوز الحد المؤقت لإرسال الرمز لهذا البريد. حاول بعد قليل.'
  }

  if (
    code === 'email_address_invalid' ||
    (message.includes('invalid') && message.includes('email'))
  ) {
    return 'تعذر إرسال الرمز إلى هذا البريد. تأكد من كتابته بشكل صحيح.'
  }

  return 'حدث خطأ أثناء إرسال الرمز، حاول مرة أخرى.'
}

function mapVerifyError(error: { code?: string; status?: number; message?: string } | null) {
  if (!error) {
    return 'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.'
  }

  const code = error.code || ''
  const message = (error.message || '').toLowerCase()

  if (
    code === 'otp_expired' ||
    code === 'invalid_credentials' ||
    message.includes('expired') ||
    message.includes('invalid') ||
    message.includes('token')
  ) {
    return 'الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا ثم حاول مرة أخرى.'
  }

  if (isRateLimitError(error)) {
    return 'تم تجاوز الحد المؤقت مؤقتًا، حاول بعد قليل.'
  }

  return 'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.'
}

export default function AccountLoginClient() {
  const [restoredChallenge] = useState<OtpChallenge | null>(() => getStoredChallenge())
  const hasRestoredActiveChallenge = restoredChallenge
    ? isValidChallenge(restoredChallenge)
    : false
  const [loginState, setLoginState] = useState<LoginState>(
    restoredChallenge ? 'OTP_ACTIVE' : 'EMAIL_ENTRY',
  )
  const [challenge, setChallenge] = useState<OtpChallenge | null>(restoredChallenge)
  const [emailInput, setEmailInput] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [emailError, setEmailError] = useState('')
  const [otpBanner, setOtpBanner] = useState<OtpBanner | null>(
    restoredChallenge && hasRestoredActiveChallenge
      ? {
          tone: 'notice',
          message: `أدخل رمز التحقق المرسل إلى ${restoredChallenge.email}.`,
        }
      : null,
  )
  const [otpError, setOtpError] = useState(
    restoredChallenge && !hasRestoredActiveChallenge
      ? 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.'
      : '',
  )
  const [now, setNow] = useState(() => Date.now())
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const flowVersionRef = useRef(0)

  const activeChallenge = useMemo(() => {
    return challenge && isValidChallenge(challenge, now) ? challenge : null
  }, [challenge, now])

  const showOtpStep = challenge !== null
  const challengeEmail = challenge?.email || ''
  const cooldownSeconds = useMemo(() => {
    if (!activeChallenge) {
      return 0
    }

    return getSecondsUntil(activeChallenge.resendAvailableAt, now)
  }, [activeChallenge, now])

  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otpCode[index] || '')
  const isSendingCode = loginState === 'SENDING_CODE'
  const isVerifyingOtp = loginState === 'VERIFYING_OTP'
  const canResend = showOtpStep && loginState === 'OTP_ACTIVE' && cooldownSeconds === 0

  useEffect(() => {
    if (!showOtpStep) {
      emailInputRef.current?.focus()
      return
    }

    const focusIndex = Math.min(otpCode.length, OTP_LENGTH - 1)

    window.requestAnimationFrame(() => {
      otpInputRefs.current[focusIndex]?.focus()
    })
  }, [otpCode.length, showOtpStep])

  const resetToEmailEntry = (options?: { email?: string; emailError?: string }) => {
    flowVersionRef.current += 1
    setLoginState('EMAIL_ENTRY')
    setChallenge(null)
    setEmailInput(options?.email ?? '')
    setOtpCode('')
    setEmailError(options?.emailError ?? '')
    setOtpBanner(null)
    setOtpError('')
    setNow(Date.now())
    otpInputRefs.current = []
    clearStoredChallenge()
  }

  const openOtpChallenge = (nextChallenge: OtpChallenge, nextBanner: OtpBanner | null) => {
    setChallenge(nextChallenge)
    setLoginState('OTP_ACTIVE')
    setOtpCode('')
    setEmailError('')
    setOtpError('')
    setOtpBanner(nextBanner)
    setNow(Date.now())
    persistChallenge(nextChallenge)
  }

  useEffect(() => {
    if (loginState !== 'OTP_ACTIVE' || !activeChallenge) {
      return
    }

    if (activeChallenge.resendAvailableAt > now) {
      const intervalId = window.setInterval(() => {
        setNow(Date.now())
      }, 1000)

      return () => {
        window.clearInterval(intervalId)
      }
    }

    const timeoutId = window.setTimeout(() => {
      setLoginState('OTP_ACTIVE')
      setOtpCode('')
      setOtpBanner(null)
      setOtpError('انتهت صلاحية الرمز. اطلب رمزًا جديدًا.')
      setNow(Date.now())
    }, Math.max(0, activeChallenge.expiresAt - now))

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeChallenge, loginState, now])

  const requestCode = async (requestedEmail: string, mode: 'initial' | 'resend') => {
    const normalizedEmail = normalizeEmail(requestedEmail)
    const requestVersion = flowVersionRef.current
    const sameEmailChallenge =
      challenge && isValidChallenge(challenge, Date.now()) && challenge.email === normalizedEmail
        ? challenge
        : null

    setEmailError('')
    setOtpError('')
    setOtpBanner(null)
    setLoginState('SENDING_CODE')

    try {
      if (mode === 'initial') {
        const readyResponse = await fetch('/api/account/login/request-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: normalizedEmail }),
        })

        if (requestVersion !== flowVersionRef.current) {
          return
        }

        if (!readyResponse.ok) {
          const payload = (await readyResponse.json().catch(() => null)) as RequestCodeResponse | null

          setChallenge(null)
          setOtpCode('')
          setOtpBanner(null)
          setOtpError('')
          setLoginState('EMAIL_ENTRY')
          clearStoredChallenge()
          setEmailError(
            payload?.error || 'حدث خطأ أثناء تجهيز تسجيل الدخول، حاول مرة أخرى.',
          )
          return
        }
      }

      const { error: sendError } = await supabaseBrowser.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
        },
      })

      if (requestVersion !== flowVersionRef.current) {
        return
      }

      if (sendError) {
        if (isRateLimitError(sendError)) {
          const nextChallenge = extendChallengeCooldown(
            sameEmailChallenge ?? createChallenge(normalizedEmail),
          )
          const waitSeconds = getSecondsUntil(nextChallenge.resendAvailableAt)

          openOtpChallenge(nextChallenge, {
            tone: 'notice',
            message: `سبق إرسال رمز إلى هذا البريد. استخدم آخر رمز تم إرساله، أو أعد الإرسال بعد ${waitSeconds} ثانية.`,
          })
          return
        }

        if (sameEmailChallenge) {
          setLoginState('OTP_ACTIVE')
          setOtpBanner(null)
          setOtpError(
            mode === 'resend'
              ? 'تعذر إرسال رمز جديد الآن. حاول مرة أخرى بعد قليل.'
              : mapSendError(sendError),
          )
          return
        }

        setLoginState('EMAIL_ENTRY')
        setEmailError(mapSendError(sendError))
        return
      }

      const nextChallenge = createChallenge(normalizedEmail)

      openOtpChallenge(nextChallenge, {
        tone: 'success',
        message:
          mode === 'initial'
            ? `أرسلنا الرمز إلى ${normalizedEmail}.`
            : `أرسلنا رمزًا جديدًا إلى ${normalizedEmail}.`,
      })
    } catch {
      if (requestVersion !== flowVersionRef.current) {
        return
      }

      if (sameEmailChallenge) {
        setLoginState('OTP_ACTIVE')
        setOtpBanner(null)
        setOtpError('حدث خطأ أثناء إرسال الرمز، حاول مرة أخرى.')
        return
      }

      setLoginState('EMAIL_ENTRY')
      setEmailError('حدث خطأ أثناء إرسال الرمز، حاول مرة أخرى.')
    }
  }

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const normalizedEmail = normalizeEmail(emailInput)

    if (!normalizedEmail) {
      setEmailError('أدخل بريدك الإلكتروني بشكل صحيح.')
      return
    }

    await requestCode(normalizedEmail, 'initial')
  }

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, '').slice(-1)
    const digits = [...otpDigits]
    digits[index] = digit

    setOtpCode(digits.join(''))
    setOtpError('')

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
    setOtpError('')

    const focusIndex = Math.min(pastedCode.length, OTP_LENGTH - 1)
    otpInputRefs.current[focusIndex]?.focus()
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!challenge) {
      resetToEmailEntry()
      return
    }

    const currentChallenge = isValidChallenge(challenge, Date.now()) ? challenge : null

    if (!currentChallenge) {
      setLoginState('OTP_ACTIVE')
      setOtpCode('')
      setOtpBanner(null)
      setOtpError('انتهت صلاحية الرمز. اطلب رمزًا جديدًا.')
      setNow(Date.now())
      return
    }

    const normalizedCode = otpCode.replace(/\D/g, '').slice(0, OTP_LENGTH)

    if (normalizedCode.length !== OTP_LENGTH) {
      setOtpError('أدخل الرمز المكوّن من 8 أرقام.')
      return
    }

    setOtpError('')
    setLoginState('VERIFYING_OTP')
    const requestVersion = flowVersionRef.current

    try {
      const {
        data: { session },
        error: verifyError,
      } = await supabaseBrowser.auth.verifyOtp({
        email: currentChallenge.email,
        token: normalizedCode,
        type: 'email',
      })

      if (requestVersion !== flowVersionRef.current) {
        return
      }

      if (verifyError) {
        if (currentChallenge.expiresAt <= Date.now()) {
          setLoginState('OTP_ACTIVE')
          setOtpCode('')
          setOtpBanner(null)
          setOtpError('انتهت صلاحية الرمز. اطلب رمزًا جديدًا.')
          setNow(Date.now())
          return
        }

        setLoginState('OTP_ACTIVE')
        setNow(Date.now())
        setOtpError(mapVerifyError(verifyError))
        return
      }

      if (!session) {
        setLoginState('OTP_ACTIVE')
        setOtpError('تعذر إنشاء الجلسة الآن. حاول مرة أخرى.')
        return
      }

      clearStoredChallenge()
      window.location.assign('/account')
    } catch {
      if (requestVersion !== flowVersionRef.current) {
        return
      }

      setLoginState('OTP_ACTIVE')
      setOtpError('حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.')
    }
  }

  const handleResendCode = async () => {
    if (!challenge || !canResend) {
      if (!challenge) {
        resetToEmailEntry()
      }
      return
    }

    await requestCode(challenge.email, 'resend')
  }

  const handleChangeEmail = () => {
    resetToEmailEntry()
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
        .account-login-notice,
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

        .account-login-notice {
          border: 1px solid #f0ddb0;
          background: #fff8e7;
          color: #8f6a14;
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

          {!showOtpStep ? (
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
                      setEmailError('')
                    }}
                    className="account-login-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingCode || isVerifyingOtp}
                  className="account-login-submit"
                >
                  {isSendingCode ? 'جاري إرسال الرمز...' : 'إرسال الرمز'}
                </button>

                {emailError && <div className="account-login-error">{emailError}</div>}
              </form>
            </div>
          ) : (
            <div className="account-login-panel">
              <h2>أدخل رمز التحقق</h2>
              <p>أرسلنا الرمز إلى بريدك الإلكتروني.</p>

              {otpBanner && (
                <div
                  className={
                    otpBanner.tone === 'success'
                      ? 'account-login-success'
                      : 'account-login-notice'
                  }
                >
                  {otpBanner.message}
                </div>
              )}

              {otpError && <div className="account-login-error">{otpError}</div>}

              <div className="account-login-meta">
                <strong>{challengeEmail}</strong>
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
                    disabled={isSendingCode || isVerifyingOtp || !activeChallenge}
                    className="account-login-submit"
                  >
                    {isVerifyingOtp ? 'جاري التحقق...' : 'تأكيد'}
                  </button>

                  <button
                    type="button"
                    disabled={!canResend}
                    onClick={handleResendCode}
                    className="account-login-secondary"
                  >
                    {cooldownSeconds > 0
                      ? `إعادة إرسال الرمز خلال ${cooldownSeconds} ثانية`
                      : isSendingCode
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
