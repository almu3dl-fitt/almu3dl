import { redirect } from 'next/navigation'
import AccountLoginClient from '@/app/account/login/AccountLoginClient'
import { getCustomerUser } from '@/lib/account-auth'

export default async function AccountLoginPage() {
  const user = await getCustomerUser()

  if (user?.email) {
    redirect('/account')
  }

  return <AccountLoginClient />
}
