import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  isValidAdminCredentials,
  isValidAdminSessionToken,
} from '@/lib/admin-auth'

async function handleAdminAuth(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return null
  }

  if (req.nextUrl.pathname === ADMIN_LOGIN_PATH) {
    return null
  }

  const adminSessionToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value

  if (await isValidAdminSessionToken(adminSessionToken)) {
    return NextResponse.next()
  }

  const auth = req.headers.get('authorization')

  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString()
      const [user, pass] = decoded.split(':')

      if (await isValidAdminCredentials(user || '', pass || '')) {
        const response = NextResponse.next()
        response.cookies.set(
          ADMIN_SESSION_COOKIE_NAME,
          await createAdminSessionToken(pass || ''),
          getAdminSessionCookieOptions(),
        )
        return response
      }
    }
  }

  const loginUrl = new URL(ADMIN_LOGIN_PATH, req.url)
  loginUrl.searchParams.set('next', `${req.nextUrl.pathname}${req.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export async function proxy(req: NextRequest) {
  const adminResponse = await handleAdminAuth(req)

  if (adminResponse) {
    return adminResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
