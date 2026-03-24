import Link from 'next/link'
import type { ReactNode } from 'react'

type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
}

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div className="admin-page-header-content">
        {eyebrow ? <span className="admin-page-eyebrow">{eyebrow}</span> : null}
        <h1 className="admin-page-title">{title}</h1>
        {description ? <p className="admin-page-description">{description}</p> : null}
      </div>

      <div className="admin-header-actions">
        {backHref && backLabel ? (
          <Link href={backHref} className="admin-button-secondary">
            {backLabel}
          </Link>
        ) : null}
        {actions}
      </div>
    </div>
  )
}
