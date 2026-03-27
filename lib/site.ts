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
}

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
