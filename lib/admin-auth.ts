export const ADMIN_USERNAME = 'admin'
export const ADMIN_LOGIN_PATH = '/admin/login'
export const ADMIN_SESSION_COOKIE_NAME = 'almu3dl_admin_session'
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 14

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return toHex(digest)
}

export async function createAdminSessionToken(password: string) {
  return sha256(`almu3dl-admin:${password}`)
}

export async function isValidAdminCredentials(username: string, password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  return Boolean(
    adminPassword &&
      username.trim().toLowerCase() === ADMIN_USERNAME &&
      password === adminPassword,
  )
}

export async function isValidAdminSessionToken(token: string | null | undefined) {
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  if (!token || !adminPassword) {
    return false
  }

  const expectedToken = await createAdminSessionToken(adminPassword)
  return token === expectedToken
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  }
}

export function getSafeAdminRedirectPath(rawValue: string | null | undefined) {
  if (!rawValue) {
    return '/admin'
  }

  if (!rawValue.startsWith('/admin') || rawValue.startsWith(ADMIN_LOGIN_PATH)) {
    return '/admin'
  }

  return rawValue
}
