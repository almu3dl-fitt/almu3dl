'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await supabaseBrowser.auth.signOut()
    router.replace('/account/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '46px',
        padding: '0.7rem 1rem',
        borderRadius: '14px',
        border: '1px solid #e7e7e7',
        background: '#fff',
        color: '#555',
        fontSize: '0.9rem',
        fontWeight: 800,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: "'Tajawal', Arial, sans-serif",
      }}
    >
      {loading ? '⏳ جاري الخروج...' : 'تسجيل الخروج'}
    </button>
  )
}
