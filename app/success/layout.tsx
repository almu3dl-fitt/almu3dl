import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تم الطلب',
  description: 'صفحة التأكيد وروابط التحميل بعد إتمام الطلب.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function SuccessLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
