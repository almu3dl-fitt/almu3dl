import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiSession } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

type OrderLookupRow = {
  id: string
  status: string
}

type OrderItemRow = {
  id: string
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorizedResponse = await requireAdminApiSession(req)

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  const { id } = await params

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .single()

  if (orderError || !order) {
    console.error('Admin delete order lookup error:', orderError)
    return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 })
  }

  const safeOrder = order as OrderLookupRow

  if (safeOrder.status === 'paid') {
    return NextResponse.json(
      { error: 'لا يمكن حذف الطلبات المدفوعة من هذه الشاشة.' },
      { status: 400 },
    )
  }

  const { data: orderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('order_id', id)

  if (orderItemsError) {
    console.error('Admin delete order items lookup error:', orderItemsError)
    return NextResponse.json({ error: 'تعذر تحميل عناصر الطلب.' }, { status: 500 })
  }

  const itemIds = ((orderItems as OrderItemRow[] | null) ?? []).map(item => item.id)

  if (itemIds.length > 0) {
    const { error: downloadsDeleteError } = await supabaseAdmin
      .from('downloads')
      .delete()
      .in('order_item_id', itemIds)

    if (downloadsDeleteError) {
      console.error('Admin delete order downloads error:', downloadsDeleteError)
      return NextResponse.json({ error: 'تعذر حذف روابط التحميل المرتبطة بالطلب.' }, { status: 500 })
    }
  }

  const { error: orderItemsDeleteError } = await supabaseAdmin
    .from('order_items')
    .delete()
    .eq('order_id', id)

  if (orderItemsDeleteError) {
    console.error('Admin delete order items error:', orderItemsDeleteError)
    return NextResponse.json({ error: 'تعذر حذف عناصر الطلب.' }, { status: 500 })
  }

  const { error: deleteOrderError } = await supabaseAdmin
    .from('orders')
    .delete()
    .eq('id', id)

  if (deleteOrderError) {
    console.error('Admin delete order error:', deleteOrderError)
    return NextResponse.json({ error: 'تعذر حذف الطلب الآن.' }, { status: 500 })
  }

  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  revalidatePath('/account')
  revalidatePath(`/account/orders/${id}`)

  return NextResponse.json({ ok: true })
}
