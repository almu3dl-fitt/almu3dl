import { NextResponse } from 'next/server'
import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
} from '@/lib/admin-auth'

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url), {
    status: 303,
  })

  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
  })

  return response
}
