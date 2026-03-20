'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

function AccountLoginContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const nextPath = searchParams.get('next') || '/account'
  const authError = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    missing_code: 'رابط الدخول غير مكتمل. حاول طلب رابط جديد.',
    magic_link: 'تعذّر إكمال تسجيل الدخول. اطلب رابطًا جديدًا وحاول مرة أخرى.',
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const normalizedEmail = email.trim().toLowerCase()
    const redirectUrl = new URL('/auth/callback', window.location.origin)
    redirectUrl.searchParams.set('next', nextPath)

    const { error: signInError } = await supabaseBrowser.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        shouldCreateUser: true,
      },
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    setEmail(normalizedEmail)
    setSent(true)
    setLoading(false)
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
          width: min(100%, 520px);
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
          margin-top: 1.2rem;
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
          padding: 0.85rem 0.95rem;
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

        .account-login-submit {
          min-height: 52px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
          font-size: 1rem;
          font-weight: 900;
          font-family: 'Tajawal', Arial, sans-serif;
          cursor: pointer;
          box-shadow: 0 16px 24px rgba(184, 145, 46, 0.22);
        }

        .account-login-submit:disabled {
          cursor: not-allowed;
          opacity: 0.7;
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
            استخدم نفس البريد الإلكتروني الذي طلبت به من قبل، وسنرسل لك رابط دخول
            آمن لصفحة حسابك بدون كلمة مرور.
          </p>

          <div className="account-login-note">
            ربط الطلبات في هذه المرحلة يعتمد على تطابق البريد الإلكتروني مع
            <strong> customer_email </strong>
            الموجود في الطلبات السابقة.
          </div>

          {authError && !error && (
            <div className="account-login-error">
              {errorMessages[authError] || 'تعذر تسجيل الدخول. حاول طلب رابط جديد.'}
            </div>
          )}

          {error && <div className="account-login-error">{error}</div>}

          {sent ? (
            <div className="account-login-success">
              تم إرسال رابط الدخول إلى <strong>{email}</strong>.
              <br />
              افتح بريدك واضغط الرابط ثم سننقلك مباشرة إلى صفحة حسابك.
            </div>
          ) : (
            <form className="account-login-form" onSubmit={handleSubmit}>
              <div className="account-login-field">
                <label htmlFor="email">البريد الإلكتروني</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="account-login-input"
                />
              </div>

              <button type="submit" disabled={loading} className="account-login-submit">
                {loading ? '⏳ جاري الإرسال...' : 'أرسل رابط الدخول'}
              </button>
            </form>
          )}

          <p className="account-login-help">
            إذا كنت قد استخدمت أكثر من بريد في الطلبات، فكل بريد سيعرض مشترياته
            الخاصة فقط.
          </p>
        </section>
      </main>
    </div>
  )
}

export default function AccountLoginClient() {
  return (
    <Suspense fallback={null}>
      <AccountLoginContent />
    </Suspense>
  )
}
