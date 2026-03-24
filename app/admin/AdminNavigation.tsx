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
    <nav className="admin-nav" aria-label="التنقل داخل لوحة الإدارة">
      <div className="admin-layout" style={{ padding: 0 }}>
        <div className="admin-nav-shell">
          <div className="admin-brand">
            <span className="admin-brand-label">ALMU3DL ADMIN</span>
            <strong className="admin-brand-title">لوحة إدارة المعضل</strong>
            <span className="admin-brand-copy">
              تحكم أسرع في المنتجات والطلبات والتقييمات من مكان واحد.
            </span>
          </div>

          <div className="admin-nav-links">
        {adminNavItems.map(item => {
          const isActive = item.match(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </Link>
          )
        })}
          </div>
        </div>
      </div>
    </nav>
  )
}
