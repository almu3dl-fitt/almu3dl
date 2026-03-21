import 'server-only'

import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

const AUTH_USERS_PAGE_SIZE = 1000

type CustomerAuthProfile = {
  email: string
  fullName?: string | null
  phone?: string | null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isDuplicateAuthUserError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false
  }

  const message = (error.message || '').toLowerCase()
  const code = (error.code || '').toLowerCase()

  return (
    code === 'email_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('already exists') ||
    message.includes('duplicate key')
  )
}

function buildUserMetadata(profile: CustomerAuthProfile) {
  return {
    ...(profile.fullName?.trim() ? { full_name: profile.fullName.trim() } : {}),
    ...(profile.phone?.trim() ? { phone: profile.phone.trim() } : {}),
  }
}

export async function findCustomerAuthUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email)
  let page = 1

  while (true) {
    const {
      data: { users } = { users: [] },
      error,
    } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    })

    if (error) {
      throw error
    }

    const matchingUser =
      users?.find(user => normalizeEmail(user.email || '') === normalizedEmail) ?? null

    if (matchingUser) {
      return matchingUser
    }

    if (!users || users.length < AUTH_USERS_PAGE_SIZE) {
      return null
    }

    page += 1
  }
}

export async function hasCustomerAuthUser(email: string) {
  const user = await findCustomerAuthUserByEmail(email)
  return Boolean(user)
}

export async function ensureCustomerAuthUser(profile: CustomerAuthProfile): Promise<User | null> {
  const normalizedEmail = normalizeEmail(profile.email)

  if (!normalizedEmail) {
    return null
  }

  const existingUser = await findCustomerAuthUserByEmail(normalizedEmail)

  if (existingUser) {
    return existingUser
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: buildUserMetadata(profile),
  })

  if (!error) {
    return data.user
  }

  if (isDuplicateAuthUserError(error)) {
    return findCustomerAuthUserByEmail(normalizedEmail)
  }

  throw error
}
