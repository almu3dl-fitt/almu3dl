'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      // تسجيل دخول
      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      // تسجيل جديد
      const { error } = await supabaseBrowser.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    router.push('/store')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontFamily: "'Tajawal', Arial, sans-serif",
    direction: 'rtl' as const,
    outline: 'none',
    backgroundColor: '#fff',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      fontFamily: "'Tajawal', 'Arial', sans-serif",
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
      `}</style>

      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        borderBottom: '1px solid #eee',
        backgroundColor: 'rgba(250,250,250,0.95)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="المعضل" width={55} height={55} style={{ objectFit: 'contain' }} />
          <span style={{
            fontSize: '1.3rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #B8912E, #D4A843)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>المعضل</span>
        </Link>
        <Link href="/store" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>← المتجر</Link>
      </nav>

      {/* Auth Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '0.5rem',
            color: '#1a1a1a',
          }}>
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#999',
            marginBottom: '2rem',
            fontSize: '0.9rem',
          }}>
            {isLogin ? 'ادخل بياناتك للوصول لبرامجك' : 'سجّل عشان تقدر تشتري وتحمّل البرامج'}
          </p>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>
                  الاسم الكامل
                </label>
                <input
                  style={inputStyle}
                  required
                  placeholder="مثال: محمد أحمد"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>
                البريد الإلكتروني
              </label>
              <input
                style={inputStyle}
                type="email"
                required
                placeholder="example@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>
                كلمة المرور
              </label>
              <input
                style={inputStyle}
                type="password"
                required
                minLength={6}
                placeholder="6 أحرف على الأقل"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              background: 'linear-gradient(135deg, #D4A843, #B8912E)',
              color: '#fff',
              border: 'none',
              padding: '0.85rem',
              borderRadius: '8px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: "'Tajawal', Arial, sans-serif",
              marginTop: '0.5rem',
            }}>
              {loading
                ? '⏳ جاري التحميل...'
                : isLogin ? 'دخول' : 'إنشاء حساب'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.9rem',
            color: '#777',
          }}>
            {isLogin ? 'ما عندك حساب؟' : 'عندك حساب؟'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                color: '#B8912E',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: "'Tajawal', Arial, sans-serif",
                textDecoration: 'underline',
              }}
            >
              {isLogin ? 'سجّل الآن' : 'سجّل دخول'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
