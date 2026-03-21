import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiSession } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const unauthorizedResponse = await requireAdminApiSession(req)

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Admin categories error:', error)
    return NextResponse.json({ error: 'تعذر تحميل الفئات الآن.' }, { status: 500 })
  }

  return NextResponse.json({ categories: data ?? [] })
}
