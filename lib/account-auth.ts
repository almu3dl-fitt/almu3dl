import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function getCustomerUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireCustomerUser() {
  const user = await getCustomerUser()

  if (!user?.email) {
    redirect('/account/login')
  }

  return user
}
