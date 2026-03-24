import type { Metadata } from 'next'
import AdminNavigation from '@/app/admin/AdminNavigation'

export const metadata: Metadata = {
  title: {
    default: 'لوحة الإدارة',
    template: '%s | إدارة المعضل',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <AdminNavigation />
      {children}
    </>
  )
}
