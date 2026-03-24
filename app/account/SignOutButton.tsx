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
      className="storefront-button-secondary"
      style={{
        width: '100%',
        background: 'rgba(255, 255, 255, 0.04)',
        color: 'var(--store-text)',
        fontSize: '0.9rem',
        fontWeight: 800,
        opacity: loading ? 0.72 : 1,
      }}
    >
      {loading ? '⏳ جاري الخروج...' : 'تسجيل الخروج'}
    </button>
  )
}
