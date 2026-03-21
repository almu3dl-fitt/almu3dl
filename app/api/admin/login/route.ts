import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  getSafeAdminRedirectPath,
  isValidAdminCredentials,
} from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const username = String(formData.get('username') || '')
  const password = String(formData.get('password') || '')
  const nextPath = getSafeAdminRedirectPath(String(formData.get('next') || '/admin'))

  if (!(await isValidAdminCredentials(username, password))) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, req.url)
    loginUrl.searchParams.set('error', 'invalid')
    loginUrl.searchParams.set('next', nextPath)
    return NextResponse.redirect(loginUrl, { status: 303 })
  }

  const response = NextResponse.redirect(new URL(nextPath, req.url), { status: 303 })
  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    await createAdminSessionToken(password),
    getAdminSessionCookieOptions(),
  )
  return response
}
