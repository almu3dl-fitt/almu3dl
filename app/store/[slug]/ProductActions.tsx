'use client'

import { useState } from 'react'

export default function ProductActions({
  productId,
  price,
  isFree,
}: {
  productId: string
  price: number
  isFree: boolean
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  }

  const handleFreeDownload = async () => {
    if (!isValidEmail(email)) {
      setError('ادخل بريد إلكتروني صحيح')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/free-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حصل خطأ، حاول مرة ثانية')
        setLoading(false)
        return
      }

      setSuccess(true)
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl)
      }
    } catch {
      setError('حصل خطأ، حاول مرة ثانية')
    }
    setLoading(false)
  }

  const handlePurchase = async () => {
    if (!isValidEmail(email)) {
      setError('ادخل بريد إلكتروني صحيح')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حصل خطأ، حاول مرة ثانية')
        setLoading(false)
        return
      }

      // توجيه لـ PayPal
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      }
    } catch {
      setError('حصل خطأ، حاول مرة ثانية')
    }
    setLoading(false)
  }

  if (success && isFree) {
    return (
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎉</p>
        <h3 style={{ color: '#16a34a', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.2rem' }}>
          تم بنجاح!
        </h3>
        <p style={{ color: '#555', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          تم إرسال الرابط على إيميلك كمان
        </p>
        {downloadUrl && (
          <a href={downloadUrl} download style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            padding: '0.85rem 2.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.05rem',
            display: 'inline-block',
            fontFamily: "var(--font-tajawal), Arial, sans-serif",
          }}>⬇️ حمّل الآن</a>
        )}
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #eee',
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: '2.5rem',
        fontWeight: 800,
        color: isFree ? '#22c55e' : '#B8912E',
        marginBottom: '0.5rem',
      }}>
        {isFree ? 'مجاني' : `${price} ريال`}
      </p>

      <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        {isFree ? 'ادخل إيميلك وحمّل مباشرة' : 'دفعة واحدة — تحميل فوري بعد الدفع'}
      </p>

      {/* حقل الإيميل */}
      <div style={{ maxWidth: '350px', margin: '0 auto 1rem' }}>
        <input
          type="email"
          placeholder="ادخل بريدك الإلكتروني"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            border: error ? '1px solid #ef4444' : '1px solid #ddd',
            borderRadius: '8px',
            fontFamily: "var(--font-tajawal), Arial, sans-serif",
            direction: 'rtl',
            outline: 'none',
            textAlign: 'center',
            backgroundColor: '#FAFAFA',
          }}
        />
        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>
        )}
      </div>

      {/* زر الشراء / التحميل */}
      <button
        onClick={isFree ? handleFreeDownload : handlePurchase}
        disabled={loading}
        style={{
          background: isFree
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'linear-gradient(135deg, #D4A843, #B8912E)',
          color: '#fff',
          border: 'none',
          padding: '1rem 3rem',
          borderRadius: '10px',
          fontSize: '1.15rem',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontFamily: "var(--font-tajawal), Arial, sans-serif",
          width: '100%',
          maxWidth: '350px',
        }}
      >
        {loading
          ? '⏳ جاري التحميل...'
          : isFree ? 'حمّل الآن مجاناً' : 'اشترِ الآن'}
      </button>
    </div>
  )
}
