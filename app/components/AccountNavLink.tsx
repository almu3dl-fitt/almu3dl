'use client'

import Link from 'next/link'
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
          className="storefront-account-menu"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="storefront-account-menu-item"
          >
            حسابي
          </Link>
          <Link
            href="/account#orders"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="storefront-account-menu-item"
          >
            طلباتي
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            role="menuitem"
            disabled={isSigningOut}
            className="storefront-account-menu-item"
            style={{
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
              opacity: isSigningOut ? 0.72 : 1,
            }}
          >
            {isSigningOut ? 'جار تسجيل الخروج...' : 'تسجيل الخروج'}
          </button>
        </div>
      )}
    </div>
  )
}
