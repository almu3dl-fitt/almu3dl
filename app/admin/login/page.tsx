import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE_NAME,
  isValidAdminSessionToken,
} from '@/lib/admin-auth'

type AdminLoginSearchParams = {
  error?: string
  next?: string
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<AdminLoginSearchParams>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const currentToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || null

  if (await isValidAdminSessionToken(currentToken)) {
    redirect(params.next?.startsWith('/admin') ? params.next : '/admin')
  }

  const nextPath =
    params.next?.startsWith('/admin') && !params.next.startsWith(ADMIN_LOGIN_PATH)
      ? params.next
      : '/admin'

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1.2rem',
        background:
          'radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 30%), #fafafa',
        fontFamily: "'Tajawal', Arial, sans-serif",
        direction: 'rtl',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');`}</style>

      <section
        style={{
          width: 'min(100%, 460px)',
          padding: '1.2rem',
          borderRadius: '24px',
          border: '1px solid rgba(17, 17, 17, 0.06)',
          background: 'rgba(255, 255, 255, 0.96)',
          boxShadow: '0 18px 34px rgba(17, 17, 17, 0.05)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            marginBottom: '0.7rem',
            padding: '0.32rem 0.72rem',
            borderRadius: '999px',
            background: 'rgba(184, 145, 46, 0.12)',
            color: '#8f6a14',
            fontSize: '0.76rem',
            fontWeight: 800,
          }}
        >
          الإدارة
        </span>

        <h1 style={{ margin: '0 0 0.45rem', fontSize: '2rem', fontWeight: 900 }}>
          دخول لوحة الإدارة
        </h1>
        <p style={{ margin: 0, color: '#787878', fontSize: '0.93rem', lineHeight: 1.9 }}>
          استخدم بيانات الإدارة للدخول إلى لوحة التحكم ومراجعة المنتجات والطلبات
          والتقييمات.
        </p>

        <form
          action="/api/admin/login"
          method="post"
          style={{ display: 'grid', gap: '0.9rem', marginTop: '1.2rem' }}
        >
          <input type="hidden" name="next" value={nextPath} />

          <div style={{ display: 'grid', gap: '0.42rem' }}>
            <label htmlFor="username" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
              اسم المستخدم
            </label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue="binzain"
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.42rem' }}>
            <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {params.error === 'invalid' && (
            <div
              style={{
                padding: '0.8rem 0.9rem',
                borderRadius: '16px',
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              بيانات الإدارة غير صحيحة. حاول مرة أخرى.
            </div>
          )}

          <button
            type="submit"
            style={{
              minHeight: '50px',
              border: 'none',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #d4a843, #b8912e)',
              color: '#fff',
              fontSize: '0.96rem',
              fontWeight: 900,
              fontFamily: "'Tajawal', Arial, sans-serif",
              cursor: 'pointer',
            }}
          >
            دخول الإدارة
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.8rem',
            flexWrap: 'wrap',
            marginTop: '1rem',
            fontSize: '0.84rem',
          }}
        >
          <Link href="/" style={{ color: '#777', textDecoration: 'none', fontWeight: 700 }}>
            ← الرئيسية
          </Link>
          <Link href="/store" style={{ color: '#8f6a14', textDecoration: 'none', fontWeight: 800 }}>
            المتجر
          </Link>
        </div>
      </section>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  minHeight: '48px',
  padding: '0.85rem 0.95rem',
  borderRadius: '14px',
  border: '1px solid #ddd',
  background: '#fff',
  fontSize: '0.95rem',
  fontFamily: "'Tajawal', Arial, sans-serif",
  direction: 'rtl' as const,
  outline: 'none',
}
