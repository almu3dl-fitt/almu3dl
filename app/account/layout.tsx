import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'حسابي',
    template: '%s | حسابي',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
