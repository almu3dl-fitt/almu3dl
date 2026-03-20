import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'إتمام الطلب',
  description: 'أدخل بيانات الطلب وأكمل عملية الشراء أو التحميل المجاني.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
