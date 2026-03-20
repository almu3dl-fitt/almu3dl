'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { addToCart, getCart, type CartItem } from '@/lib/cart'

export default function AddToCartButton({ product }: { product: CartItem }) {
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const updateState = () => {
      const inCart = getCart().some((i) => i.id === product.id)
      setAdded(inCart)
    }

    updateState()
    window.addEventListener('cart-updated', updateState)
    window.addEventListener('storage', updateState)

    return () => {
      window.removeEventListener('cart-updated', updateState)
      window.removeEventListener('storage', updateState)
    }
  }, [product.id])

  const handleAdd = () => {
    addToCart(product)
    setAdded(true)
  }

  if (added) {
    return (
      <div style={{ display: 'grid', gap: '0.65rem', width: '100%' }}>
        <span
          style={{
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            padding: '0.8rem 1rem',
            borderRadius: '12px',
            fontSize: '0.92rem',
            fontWeight: 700,
            fontFamily: "'Tajawal', Arial, sans-serif",
            textAlign: 'center',
            border: '1px solid #bbf7d0',
          }}
        >
          ✓ في السلة
        </span>

        <Link
          href="/cart"
          style={{
            background: 'linear-gradient(135deg, #111111, #2d2d2d)',
            color: '#fff',
            padding: '0.9rem 1rem',
            borderRadius: '12px',
            fontSize: '0.94rem',
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: "'Tajawal', Arial, sans-serif",
            textAlign: 'center',
            boxShadow: '0 14px 24px rgba(17, 17, 17, 0.12)',
          }}
        >
          عرض السلة
        </Link>
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      style={{
        background: product.is_free
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : 'linear-gradient(135deg, #D4A843, #B8912E)',
        color: '#fff',
        border: 'none',
        padding: '0.95rem 1.25rem',
        borderRadius: '14px',
        fontSize: '1rem',
        fontWeight: 800,
        cursor: 'pointer',
        fontFamily: "'Tajawal', Arial, sans-serif",
        width: '100%',
        boxShadow: product.is_free
          ? '0 16px 24px rgba(34, 197, 94, 0.22)'
          : '0 16px 24px rgba(184, 145, 46, 0.24)',
      }}
    >
      {product.is_free ? 'أضف للسلة (مجاني)' : 'أضف للسلة'}
    </button>
  )
}
