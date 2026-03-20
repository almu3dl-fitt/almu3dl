'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

type AuthState = 'loading' | 'guest' | 'authenticated'

export default function AccountNavLink({
  className,
}: {
  className: string
}) {
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!mounted) {
        return
      }

      setAuthState(user?.email ? 'authenticated' : 'guest')
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setAuthState(session?.user?.email ? 'authenticated' : 'guest')
    })

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabaseBrowser.auth.signOut()
    setAuthState('guest')
    setIsOpen(false)
    router.push('/account/login')
    router.refresh()
    setIsSigningOut(false)
  }

  if (authState === 'guest') {
    return (
      <Link href="/account/login" className={className}>
        تسجيل الدخول
      </Link>
    )
  }

  if (authState === 'loading') {
    return (
      <span
        className={className}
        style={{ pointerEvents: 'none', opacity: 0.78 }}
        aria-hidden="true"
      >
        الحساب
      </span>
    )
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className={className}
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{ cursor: 'pointer' }}
      >
        حسابي
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.55rem)',
            insetInlineEnd: 0,
            minWidth: '190px',
            padding: '0.45rem',
            borderRadius: '16px',
            border: '1px solid rgba(17, 17, 17, 0.08)',
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 18px 30px rgba(17, 17, 17, 0.08)',
            backdropFilter: 'blur(14px)',
            zIndex: 120,
          }}
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={menuItemStyle}
          >
            حسابي
          </Link>
          <Link
            href="/account#orders"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={menuItemStyle}
          >
            طلباتي
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            role="menuitem"
            disabled={isSigningOut}
            style={{
              ...menuItemStyle,
              width: '100%',
              border: 'none',
              background: 'transparent',
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
            }}
          >
            {isSigningOut ? 'جار تسجيل الخروج...' : 'تسجيل الخروج'}
          </button>
        </div>
      )}
    </div>
  )
}

const menuItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minHeight: '42px',
  padding: '0.7rem 0.8rem',
  borderRadius: '12px',
  color: '#333',
  textDecoration: 'none',
  fontSize: '0.88rem',
  fontWeight: 800,
  fontFamily: "'Tajawal', Arial, sans-serif",
  textAlign: 'right',
}
