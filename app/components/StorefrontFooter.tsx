'use client'

import Link from 'next/link'
import BrandMark from '@/app/components/BrandMark'
import BrandName from '@/app/components/BrandName'
import {
  CATEGORY_DEFINITIONS,
  FOOTER_LINKS,
  SITE_DESCRIPTION,
  SOCIAL_LINKS,
  siteConfig,
} from '@/lib/site'

function SocialIcon({ label }: { label: string }) {
  switch (label) {
    case 'Instagram':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="4" strokeWidth="1.7" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'TikTok':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M14.2 3h2.7c.3 2 1.5 3.6 3.3 4.3v2.8c-1.5 0-2.9-.4-4.1-1.2v6.1a5 5 0 1 1-4.4-5v2.9a2.2 2.2 0 1 0 1.6 2.1V3Z" />
        </svg>
      )
    case 'Snapchat':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M12 3.2c2.2 0 4 1.8 4 4v1.1c0 .4.2.8.5 1l1 .7c.5.3.5 1 0 1.3l-1.1.7c-.3.2-.5.5-.5.9 0 2.3-1.8 4.2-4 4.2s-4-1.9-4-4.2c0-.4-.2-.7-.5-.9l-1.1-.7c-.5-.3-.5-1 0-1.3l1-.7c.3-.2.5-.6.5-1V7.2c0-2.2 1.8-4 4-4Zm2.6 14.3c.5.8 1.3 1.3 2.3 1.4.4 0 .5.6.1.8-.8.5-1.8.7-2.8.7-.6 0-1.1.3-1.6.7-.3.3-.7.5-1.2.5s-.9-.2-1.2-.5c-.5-.4-1-.7-1.6-.7-1 0-2-.2-2.8-.7-.4-.2-.3-.8.1-.8 1-.1 1.8-.6 2.3-1.4.3-.4.9-.4 1.2 0 .4.5 1 .8 1.9.8s1.5-.3 1.9-.8c.3-.4.9-.4 1.2 0Z" />
        </svg>
      )
    case 'YouTube':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M21 8.4c-.2-1.4-1.3-2.5-2.7-2.7C16.6 5.5 14.3 5.4 12 5.4s-4.6.1-6.3.3C4.3 5.9 3.2 7 3 8.4c-.2 1.2-.3 2.4-.3 3.6s.1 2.4.3 3.6c.2 1.4 1.3 2.5 2.7 2.7 1.7.2 4 .3 6.3.3s4.6-.1 6.3-.3c1.4-.2 2.5-1.3 2.7-2.7.2-1.2.3-2.4.3-3.6s-.1-2.4-.3-3.6Zm-10.9 6V9.6l4.4 2.4-4.4 2.4Z" />
        </svg>
      )
    case 'Telegram':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M20.6 4.2 3.9 10.6c-1.1.4-1.1 2 .1 2.3l4.2 1.3 1.6 5c.3.9 1.4 1.2 2 .5l2.4-2.7 4.2 3.1c.8.6 1.9.1 2.1-.9l2.2-13c.2-1.2-1-2.1-2.1-1.7Zm-9.5 10.4-.4 3-1.1-3.5 8-6.1-6.5 6.6Z" />
        </svg>
      )
    case 'X':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M18.9 3H21l-6.2 7.1L22 21h-5.6l-4.4-5.8L6.9 21H4.8l6.7-7.6L2 3h5.8l4 5.2L18.9 3Zm-2 16.3h1.2L7 4.6H5.8l11.1 14.7Z" />
        </svg>
      )
    default:
      return <span className="text-xs font-black">{label.slice(0, 2)}</span>
  }
}

export default function StorefrontFooter({
  note = 'برامج رقمية في التغذية والتمارين والتأهيل مع شراء آمن ووصول مباشر.',
}: {
  note?: string
}) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="theme-footer mt-12">
      <div className="site-container space-y-8 py-10">
        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <BrandMark size="lg" showCopy={false} />
              <div>
                <BrandName className="display-heading brand-gradient-text text-lg font-black" />
                <p className="theme-text-soft mt-2 max-w-xl text-sm leading-7">
                  {SITE_DESCRIPTION}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {SOCIAL_LINKS.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="theme-pill inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--fg)] hover:bg-[var(--gold)] hover:text-black"
                >
                  <SocialIcon label={link.label} />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="theme-text-muted text-sm font-semibold uppercase tracking-[0.18em]">
              الصفحات
            </div>
            <div className="theme-text-soft flex flex-col gap-3 text-sm">
              {FOOTER_LINKS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[var(--gold-soft)]"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={siteConfig.blogUrl}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[var(--gold-soft)]"
              >
                المدونة
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="theme-text-muted text-sm font-semibold uppercase tracking-[0.18em]">
              التصنيفات
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_DEFINITIONS.map(category => (
                <Link
                  key={category.slug}
                  href={category.slug === 'bundles' ? '/store' : `/store?category=${category.slug}`}
                  className="theme-pill rounded-full px-3 py-2 text-xs"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <div className="theme-inset-card-strong theme-text-soft rounded-[24px] p-4 text-sm leading-7">
              {note}
            </div>
          </div>
        </div>

        <div
          className="theme-text-muted flex flex-col items-center justify-between gap-4 border-t pt-5 text-sm md:flex-row"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            © {currentYear} <BrandName /> — متجر اللياقة والتغذية
          </div>
          <div>برامج في اللياقة، التغذية، والتأهيل مع وصول مباشر بعد الشراء.</div>
        </div>
      </div>
    </footer>
  )
}
