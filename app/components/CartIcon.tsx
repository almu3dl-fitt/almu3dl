'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getCart } from '@/lib/cart'

export default function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(getCart().length)
    update()
    window.addEventListener('cart-updated', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('cart-updated', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return (
    <Link href="/cart" className="storefront-cart-icon storefront-theme-pill" aria-label="عرض السلة">
      <span className="storefront-cart-icon-symbol" aria-hidden="true">🛒</span>
      <span className="storefront-cart-icon-label">السلة</span>
      {count > 0 && (
        <span className="storefront-cart-count">{count}</span>
      )}
    </Link>
  )
}
