'use client'

import { useEffect } from 'react'
import { clearCart } from '@/lib/cart'

const CHECKOUT_PROCESSING_KEY = 'almu3dl_checkout_processing'

export default function SuccessCartCleanup() {
  useEffect(() => {
    clearCart()
    window.sessionStorage.removeItem(CHECKOUT_PROCESSING_KEY)
  }, [])

  return null
}
