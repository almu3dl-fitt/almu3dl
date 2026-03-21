import { NextRequest, NextResponse } from 'next/server'
import { hasCustomerAuthUser } from '@/lib/customer-auth'

type RequestCodeBody = {
  email?: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestCodeBody
    const normalizedEmail = normalizeEmail(body.email || '')

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'أدخل بريدك الإلكتروني بشكل صحيح.' }, { status: 400 })
    }

    const hasReadyAccount = await hasCustomerAuthUser(normalizedEmail)

    if (!hasReadyAccount) {
      return NextResponse.json(
        {
          error:
            'لا يوجد حساب مرتبط بهذا البريد بعد. أكمل أول طلب وسيتم تجهيز حسابك تلقائيًا.',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Customer login request-code error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تجهيز تسجيل الدخول، حاول مرة أخرى.' },
      { status: 500 },
    )
  }
}
