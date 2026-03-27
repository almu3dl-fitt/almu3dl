import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { getMetadataBase, siteConfig } from '@/lib/site'
import { THEME_STORAGE_KEY } from '@/lib/theme'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteConfig.title,
    template: '%s | المعضل',
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'المعضل',
    'متجر رقمي',
    'برامج غذائية',
    'برامج رياضية',
    'برامج علاجية',
    'باقات رقمية',
    'تمارين',
    'تغذية',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.shortDescription,
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

const themeInitScript = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      var systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      var theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme;
      document.documentElement.dataset.theme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = 'dark';
    }
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
