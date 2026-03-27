'use client'

import Link from 'next/link'
import AccountNavLink from '@/app/components/AccountNavLink'
import BrandMark from '@/app/components/BrandMark'
import CartIcon from '@/app/components/CartIcon'
import ThemeToggle from '@/app/components/ThemeToggle'
import { siteConfig } from '@/lib/site'

type HeaderAction = {
  href: string
  label: string
  variant?: 'default' | 'primary' | 'muted'
  external?: boolean
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
  const headerActions = showBlogLink
    ? [{ href: siteConfig.blogUrl, label: 'المدونة', variant: 'muted', external: true } satisfies HeaderAction, ...actions]
    : actions

  return (
    <header className="storefront-header">
      <div className="storefront-header-inner">
        <Link href="/" className="storefront-brand">
          <BrandMark />
        </Link>

        <div className="storefront-header-actions">
          <ThemeToggle />
          {showCart && <CartIcon />}
          {showAccount && <AccountNavLink className="storefront-action" />}
          {headerActions.map(action => {
            const className = [
              'storefront-action',
              action.variant === 'primary' ? 'is-primary' : '',
              action.variant === 'muted' ? 'is-muted' : '',
            ]
              .filter(Boolean)
              .join(' ')

            if (action.external) {
              return (
                <a
                  key={`${action.href}:${action.label}`}
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
              <Link
                key={`${action.href}:${action.label}`}
                href={action.href}
                className={className}
              >
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
