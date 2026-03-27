import Link from 'next/link'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'

type PageAction = {
  href: string
  label: string
  variant?: 'default' | 'primary' | 'muted'
  external?: boolean
}

type PageCard = {
  title: string
  description: string
  href?: string
  linkLabel?: string
  external?: boolean
}

type PageSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

function PageLink({
  href,
  label,
  external = false,
  className,
}: {
  href: string
  label: string
  external?: boolean
  className: string
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}

export default function StorefrontContentPage({
  eyebrow,
  title,
  description,
  headerActions = [],
  heroActions = [],
  cards = [],
  sections = [],
  footerNote,
}: {
  eyebrow: string
  title: string
  description: string
  headerActions?: PageAction[]
  heroActions?: PageAction[]
  cards?: PageCard[]
  sections?: PageSection[]
  footerNote: string
}) {
  return (
    <div className="storefront-shell">
      <StorefrontHeader showBlogLink actions={headerActions} />

      <main className="content-page-main">
        <section className="content-page-hero">
          <span className="content-page-eyebrow">{eyebrow}</span>
          <h1 className="content-page-title">{title}</h1>
          <p className="content-page-description">{description}</p>

          {heroActions.length > 0 && (
            <div className="content-page-actions">
              {heroActions.map(action => (
                <PageLink
                  key={`${action.href}:${action.label}`}
                  href={action.href}
                  label={action.label}
                  external={action.external}
                  className={[
                    'storefront-action',
                    action.variant === 'primary' ? 'is-primary' : '',
                    action.variant === 'muted' ? 'is-muted' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              ))}
            </div>
          )}
        </section>

        {cards.length > 0 && (
          <section className="content-page-card-grid">
            {cards.map(card => (
              <article key={card.title} className="content-page-card">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                {card.href && card.linkLabel && (
                  <PageLink
                    href={card.href}
                    label={card.linkLabel}
                    external={card.external}
                    className="content-page-inline-link"
                  />
                )}
              </article>
            ))}
          </section>
        )}

        <section className="content-page-sections">
          {sections.map(section => (
            <article key={section.title} className="content-page-section">
              <h2>{section.title}</h2>

              {section.paragraphs?.map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {section.bullets && section.bullets.length > 0 && (
                <ul>
                  {section.bullets.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      </main>

      <StorefrontFooter note={footerNote} />
    </div>
  )
}
