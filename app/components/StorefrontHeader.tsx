'use client'

import Link from 'next/link'
import AccountNavLink from '@/app/components/AccountNavLink'
import BrandMark from '@/app/components/BrandMark'
import CartIcon from '@/app/components/CartIcon'

type HeaderAction = {
  href: string
  label: string
  variant?: 'default' | 'primary' | 'muted'
}

export default function StorefrontHeader({
  actions = [],
  showCart = true,
  showAccount = true,
}: {
  actions?: HeaderAction[]
  showCart?: boolean
  showAccount?: boolean
}) {
  return (
    <header className="storefront-header">
      <div className="storefront-header-inner">
        <Link href="/" className="storefront-brand">
          <BrandMark />
        </Link>

        <div className="storefront-header-actions">
          {showCart && <CartIcon />}
          {showAccount && <AccountNavLink className="storefront-action" />}
          {actions.map(action => (
            <Link
              key={`${action.href}:${action.label}`}
              href={action.href}
              className={[
                'storefront-action',
                action.variant === 'primary' ? 'is-primary' : '',
                action.variant === 'muted' ? 'is-muted' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
