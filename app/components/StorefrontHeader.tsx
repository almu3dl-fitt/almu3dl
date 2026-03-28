'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AccountNavLink from '@/app/components/AccountNavLink'
import CartIcon from '@/app/components/CartIcon'
import ThemeToggle from '@/app/components/ThemeToggle'
import { siteConfig } from '@/lib/site'

type HeaderAction = {
  href: string
  label: string
  variant?: 'default' | 'primary' | 'muted'
  external?: boolean
}

type ResolvedAction = HeaderAction & {
  key: string
}

const MAIN_NAV_ITEMS: HeaderAction[] = [
  { href: '/', label: 'الرئيسية' },
  { href: '/store', label: 'المتجر' },
  { href: siteConfig.blogUrl, label: 'المدونة', external: true },
  { href: '/about', label: 'عن المعضّل' },
  { href: '/contact', label: 'تواصل' },
  { href: '/privacy-policy', label: 'الخصوصية' },
]

function normalizeAction(action: HeaderAction): ResolvedAction {
  return {
    ...action,
    key: `${action.href}:${action.label}:${action.variant ?? 'default'}:${action.external ? 'external' : 'internal'}`,
  }
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`)
}

function HeaderLink({
  action,
  className,
}: {
  action: HeaderAction
  className: string
}) {
  if (action.external) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {action.label}
      </a>
    )
  }

  return (
    <Link href={action.href} className={className}>
      {action.label}
    </Link>
  )
}

export default function StorefrontHeader({
  actions = [],
  showCart = true,
  showAccount = true,
  showBlogLink = false,
}: {
  actions?: HeaderAction[]
  showCart?: boolean
  showAccount?: boolean
  showBlogLink?: boolean
}) {
  const pathname = usePathname()

  const navItems = MAIN_NAV_ITEMS.filter(item => showBlogLink || item.href !== siteConfig.blogUrl)

  const optionalActions = actions.map(normalizeAction)

  const secondaryActions = optionalActions.filter(action => {
    if (navItems.some(item => item.href === action.href && item.external === action.external)) {
      return false
    }

    if (showCart && !action.external && action.href === '/cart') {
      return false
    }

    return true
  })

  return (
    <header className="theme-header storefront-theme-header">
      <div className="site-container storefront-theme-header-inner">
        <div className="storefront-theme-brand-row">
          <Link href="/" className="storefront-theme-brand">
            <span className="storefront-theme-brand-mark" aria-hidden="true">
              <Image
                src="/logo.png"
                alt=""
                width={48}
                height={48}
                className="storefront-theme-brand-image"
              />
            </span>

            <span className="storefront-theme-brand-copy">
              <span className="display-heading brand-gradient-text storefront-theme-brand-title">
                <span>المعضّل</span>
                <span className="storefront-theme-brand-separator">-</span>
                <bdi dir="ltr" className="storefront-theme-brand-bdi">Almu3dl</bdi>
              </span>
              <span className="theme-text-muted storefront-theme-brand-tagline">
                متجر البرامج الرقمية للياقة والتغذية والأداء الرياضي
              </span>
            </span>
          </Link>

        </div>

        <div className="storefront-theme-main">
          <nav className="storefront-theme-nav" aria-label="التنقل الرئيسي">
            {navItems.map(item => (
              <HeaderLink
                key={item.href}
                action={item}
                className={[
                  'storefront-theme-nav-link',
                  item.external
                    ? 'theme-pill'
                    : isActivePath(pathname, item.href)
                      ? 'theme-pill-active is-active'
                      : 'theme-pill',
                ].join(' ')}
              />
            ))}

            {secondaryActions.map(action => (
              <HeaderLink
                key={action.key}
                action={action}
                className={[
                  'storefront-theme-nav-link',
                  action.variant === 'muted' ? 'storefront-theme-nav-link-muted' : '',
                  'theme-pill',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </nav>

          <div className="storefront-theme-utility">
            <ThemeToggle />
            {showAccount && (
              <AccountNavLink className="theme-pill storefront-theme-pill storefront-theme-account-link" />
            )}
            {showCart && <CartIcon />}
          </div>
        </div>
      </div>
    </header>
  )
}
