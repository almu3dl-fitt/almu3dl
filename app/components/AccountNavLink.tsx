import Link from 'next/link'
import { getCustomerUser } from '@/lib/account-auth'

export default async function AccountNavLink({
  className,
}: {
  className: string
}) {
  const user = await getCustomerUser()
  const isLoggedIn = Boolean(user?.email)

  return (
    <Link
      href={isLoggedIn ? '/account' : '/account/login'}
      className={className}
    >
      {isLoggedIn ? 'حسابي' : 'تسجيل الدخول'}
    </Link>
  )
}
