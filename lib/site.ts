export const siteConfig = {
  name: 'المعضل',
  title: 'المعضل | متجر البرامج الرياضية والغذائية الرقمية',
  description:
    'المعضل متجر عربي لبرامج التغذية والتمارين والباقات الرقمية مع شراء سريع، وصول فوري، وتجربة استخدام واضحة على الجوال.',
  shortDescription:
    'متجر عربي لبرامج التغذية والتمارين والباقات الرقمية مع وصول فوري وتجربة شراء واضحة.',
  defaultUrl: 'http://localhost:3000',
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
