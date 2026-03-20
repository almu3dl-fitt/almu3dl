'use client'

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
    <a href="/cart" style={{
      position: 'relative',
      textDecoration: 'none',
      fontSize: '1.4rem',
      color: '#555',
    }}>
      🛒
      {count > 0 && (
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '-10px',
          backgroundColor: '#B8912E',
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 700,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>{count}</span>
      )}
    </a>
  )
}