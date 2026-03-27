'use client'

import Link from 'next/link'
import { siteConfig } from '@/lib/site'

const footerLinks = [
  { href: '/about', label: 'من نحن' },
  { href: '/privacy-policy', label: 'سياسة الخصوصية' },
  { href: '/refund-policy', label: 'سياسة الاسترجاع والاستبدال' },
  { href: '/contact', label: 'تواصل معنا' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
]

export default function StorefrontFooter({
  note = 'برامج رقمية في التغذية والتمارين والتأهيل مع شراء آمن ووصول مباشر.',
}: {
  note?: string
}) {
  return (
    <footer className="storefront-footer">
      <div className="storefront-footer-inner">
        <div className="storefront-footer-meta">
          <p className="storefront-footer-copy">
            © {new Date().getFullYear()} المعضل. جميع الحقوق محفوظة.
          </p>
          <p className="storefront-footer-note">{note}</p>
        </div>

        <nav className="storefront-footer-links" aria-label="روابط المتجر الأساسية">
          {footerLinks.map(link => (
            <Link key={link.href} href={link.href} className="storefront-footer-link">
              {link.label}
            </Link>
          ))}
          <a
            href={siteConfig.blogUrl}
            target="_blank"
            rel="noreferrer"
            className="storefront-footer-link is-external"
          >
            المدونة
          </a>
        </nav>

        <div className="storefront-footer-socials" aria-label="حسابات التواصل الاجتماعي">
          {siteConfig.socialLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="storefront-social-link"
              aria-label={link.label}
              title={link.label}
            >
              <span className="storefront-social-pill">{link.shortLabel}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
