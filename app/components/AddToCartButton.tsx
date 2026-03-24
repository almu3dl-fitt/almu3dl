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
            backgroundColor: 'var(--store-success-wash)',
            color: 'var(--store-success)',
            padding: '0.85rem 1rem',
            borderRadius: '16px',
            fontSize: '0.92rem',
            fontWeight: 800,
            fontFamily: "'Tajawal', Arial, sans-serif",
            textAlign: 'center',
            border: '1px solid rgba(61, 194, 108, 0.22)',
          }}
        >
          ✓ في السلة
        </span>

        <Link
          href="/cart"
          className="storefront-button-secondary"
          style={{ width: '100%' }}
        >
          عرض السلة
        </Link>
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className="storefront-button-primary"
      style={{
        background: product.is_free
          ? 'linear-gradient(135deg, #59d88b, #2fac5e)'
          : 'linear-gradient(135deg, var(--store-accent-strong), var(--store-accent))',
        color: product.is_free ? '#062612' : '#111',
        border: 'none',
        width: '100%',
        boxShadow:
          product.is_free
            ? '0 18px 30px rgba(61, 194, 108, 0.22)'
            : '0 18px 30px rgba(224, 180, 72, 0.22)',
      }}
    >
      {product.is_free ? 'أضف إلى السلة مجانًا' : 'أضف إلى السلة'}
    </button>
  )
}
