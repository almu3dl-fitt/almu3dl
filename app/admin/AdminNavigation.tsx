'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNavItems = [
  { href: '/admin', label: 'الرئيسية', match: (pathname: string) => pathname === '/admin' },
  {
    href: '/admin/products',
    label: 'المنتجات',
    match: (pathname: string) => pathname.startsWith('/admin/products'),
  },
  {
    href: '/admin/orders',
    label: 'الطلبات',
    match: (pathname: string) => pathname.startsWith('/admin/orders'),
  },
  {
    href: '/admin/reviews',
    label: 'التقييمات',
    match: (pathname: string) => pathname.startsWith('/admin/reviews'),
  },
]

export default function AdminNavigation() {
  const pathname = usePathname()

  if (!pathname || pathname === '/admin/login') {
    return null
  }

  return (
    <nav
      aria-label="التنقل داخل لوحة الإدارة"
      style={{
        padding: '1rem 2rem 0',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem',
          padding: '0.75rem',
          borderRadius: '18px',
          border: '1px solid #eee',
          background: '#fff',
        }}
      >
        {adminNavItems.map(item => {
          const isActive = item.match(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                minHeight: '42px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: isActive ? '1px solid #d4a843' : '1px solid #ececec',
                background: isActive ? 'rgba(212, 168, 67, 0.12)' : '#fff',
                color: isActive ? '#8f6a14' : '#555',
                textDecoration: 'none',
                fontSize: '0.92rem',
                fontWeight: 800,
                fontFamily: "'Tajawal', Arial, sans-serif",
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
