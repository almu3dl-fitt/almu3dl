import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'السلة',
  description: 'راجع المنتجات المختارة قبل الانتقال إلى إتمام الطلب.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
