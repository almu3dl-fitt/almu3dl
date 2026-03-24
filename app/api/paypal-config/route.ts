import { NextResponse } from 'next/server'
import { PAYPAL_CURRENCY_CODE } from '@/lib/paypal-currency'

export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID

  if (!clientId) {
    return NextResponse.json({ error: 'تعذر تحميل إعدادات PayPal' }, { status: 500 })
  }

  return NextResponse.json({
    clientId,
    currency: PAYPAL_CURRENCY_CODE,
    intent: 'capture',
    mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
  })
}
