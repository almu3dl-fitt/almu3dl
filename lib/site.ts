export type SocialLink = {
  label: string
  href: string
  shortLabel: string
}

export type FooterLink = {
  href: string
  label: string
}

export type CategoryDefinition = {
  slug: string
  name: string
}

export const siteConfig = {
  name: 'المعضل',
  title: 'المعضل | متجر البرامج الرياضية والغذائية الرقمية',
  description:
    'المعضل متجر لبرامج التغذية والتمارين والباقات الرقمية مع شراء سريع، وصول فوري، وتجربة استخدام واضحة على الجوال.',
  shortDescription:
    'متجر لبرامج التغذية والتمارين والباقات الرقمية مع وصول فوري وتجربة شراء واضحة.',
  defaultUrl: 'http://localhost:3000',
  blogUrl: process.env.NEXT_PUBLIC_BLOG_URL || 'https://almu3dl-blog.almu3dl.store',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'almu3dl@gmail.com',
  socialLinks: [
    {
      label: 'Instagram',
      shortLabel: 'IG',
      href: 'https://www.instagram.com/bin_zain/',
    },
    {
      label: 'TikTok',
      shortLabel: 'TT',
      href: 'https://www.tiktok.com/@almu3dl',
    },
    {
      label: 'Snapchat',
      shortLabel: 'SC',
      href: 'https://www.snapchat.com/add/almu3dl',
    },
    {
      label: 'YouTube',
      shortLabel: 'YT',
      href: 'https://www.youtube.com/@almu3dl',
    },
    {
      label: 'Telegram',
      shortLabel: 'TG',
      href: 'https://t.me/almu3dl',
    },
    {
      label: 'X',
      shortLabel: 'X',
      href: 'https://x.com/almu3dl',
    },
  ] satisfies SocialLink[],
}

export const SOCIAL_LINKS = siteConfig.socialLinks

export const SITE_DESCRIPTION =
  'برامج رقمية في التغذية والتمارين والتأهيل مع شراء آمن ووصول مباشر وتجربة واضحة على الجوال والكمبيوتر.'

export const FOOTER_LINKS: FooterLink[] = [
  { href: '/about', label: 'من نحن' },
  { href: '/privacy-policy', label: 'سياسة الخصوصية' },
  { href: '/refund-policy', label: 'سياسة الاسترجاع والاستبدال' },
  { href: '/contact', label: 'تواصل معنا' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
]

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { slug: 'nutrition', name: 'التغذية' },
  { slug: 'workouts', name: 'التمارين' },
  { slug: 'therapy', name: 'العلاجية' },
  { slug: 'bundles', name: 'الباقات' },
]

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.defaultUrl).replace(/\/$/, '')
}

export function getMetadataBase() {
  return new URL(getSiteUrl())
}

export function buildAbsoluteUrl(path = '/') {
  return new URL(path, getSiteUrl()).toString()
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trim()}…`
}
