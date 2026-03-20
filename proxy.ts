import { NextRequest, NextResponse } from 'next/server'

function handleAdminAuth(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return null
  }

  const auth = req.headers.get('authorization')

  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString()
      const [user, pass] = decoded.split(':')
      if (user === 'admin' && pass === process.env.ADMIN_PASSWORD) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Panel"',
    },
  })
}

export function proxy(req: NextRequest) {
  const adminResponse = handleAdminAuth(req)

  if (adminResponse) {
    return adminResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
