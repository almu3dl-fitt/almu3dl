'use client'

export interface CartItem {
  id: string
  title: string
  price: number
  is_free: boolean
  slug: string
  categorySlug: string
}

const CART_KEY = 'almu3dl_cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(CART_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart()
  // لا تضيف نفس المنتج مرتين
  if (cart.find(i => i.id === item.id)) return cart
  const updated = [...cart, item]
  localStorage.setItem(CART_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('cart-updated'))
  return updated
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter(i => i.id !== productId)
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
  return cart
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cart-updated'))
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + (item.is_free ? 0 : item.price), 0)
}