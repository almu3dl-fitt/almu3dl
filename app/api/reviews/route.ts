import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type ReviewBody = {
  orderId?: string
  productId?: string
  rating?: number
  comment?: string
}

type PurchaseRow = {
  id: string
  order_id: string
  product_id: string
  products: { title: string; slug: string } | { title: string; slug: string }[] | null
  orders:
    | { customer_name: string | null; customer_email: string | null; status: string | null }
    | {
        customer_name: string | null
        customer_email: string | null
        status: string | null
      }[]
    | null
}

type ExistingReviewRow = {
  id: string
  status: string
}

function normalizeRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 })
    }

    const body = (await req.json()) as ReviewBody
    const orderId = body.orderId?.trim()
    const productId = body.productId?.trim()
    const rating = Number(body.rating ?? 0)
    const comment = body.comment?.trim() || ''

    if (!orderId || !productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'بيانات التقييم غير مكتملة.' }, { status: 400 })
    }

    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        products ( title, slug ),
        orders!inner ( customer_name, customer_email, status )
      `)
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .ilike('orders.customer_email', user.email)
      .eq('orders.status', 'paid')
      .maybeSingle()

    if (purchaseError) {
      console.error('Review purchase verification error:', purchaseError)
      return NextResponse.json({ error: 'تعذر التحقق من أهلية التقييم.' }, { status: 500 })
    }

    const purchaseRow = (purchase as PurchaseRow | null) ?? null

    if (!purchaseRow) {
      return NextResponse.json({ error: 'لا يمكنك تقييم هذا المنتج إلا بعد شرائه.' }, { status: 403 })
    }

    const product = normalizeRelation(purchaseRow.products)
    const order = normalizeRelation(purchaseRow.orders)

    const { data: existingReview, error: existingReviewError } = await supabaseAdmin
      .from('product_reviews')
      .select('id, status')
      .eq('product_id', productId)
      .ilike('customer_email', user.email)
      .maybeSingle()

    if (existingReviewError) {
      if (existingReviewError.code === 'PGRST205') {
        return NextResponse.json(
          { error: 'نظام التقييمات يحتاج تطبيق migration قاعدة البيانات أولاً.' },
          { status: 500 },
        )
      }

      console.error('Review lookup error:', existingReviewError)
      return NextResponse.json({ error: 'تعذر حفظ التقييم الآن.' }, { status: 500 })
    }

    const reviewPayload = {
      order_id: orderId,
      order_item_id: purchaseRow.id,
      product_id: productId,
      customer_email: user.email,
      customer_name:
        order?.customer_name?.trim() ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        null,
      rating,
      comment: comment || null,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }

    if (existingReview) {
      const { error: updateError } = await supabaseAdmin
        .from('product_reviews')
        .update(reviewPayload)
        .eq('id', (existingReview as ExistingReviewRow).id)

      if (updateError) {
        if (updateError.code === 'PGRST205') {
          return NextResponse.json(
            { error: 'نظام التقييمات يحتاج تطبيق migration قاعدة البيانات أولاً.' },
            { status: 500 },
          )
        }

        console.error('Review update error:', updateError)
        return NextResponse.json({ error: 'تعذر تحديث التقييم الآن.' }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('product_reviews')
        .insert({
          ...reviewPayload,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        if (insertError.code === 'PGRST205') {
          return NextResponse.json(
            { error: 'نظام التقييمات يحتاج تطبيق migration قاعدة البيانات أولاً.' },
            { status: 500 },
          )
        }

        console.error('Review insert error:', insertError)
        return NextResponse.json({ error: 'تعذر إرسال التقييم الآن.' }, { status: 500 })
      }
    }

    revalidatePath('/account')
    revalidatePath(`/account/orders/${orderId}`)

    if (product?.slug) {
      revalidatePath(`/store/${product.slug}`)
    }

    return NextResponse.json({
      message: existingReview
        ? 'تم تحديث تقييمك وإرساله للمراجعة.'
        : 'تم استلام تقييمك وسيظهر بعد المراجعة.',
    })
  } catch (error) {
    console.error('Review route error:', error)
    return NextResponse.json({ error: 'حصل خطأ أثناء حفظ التقييم.' }, { status: 500 })
  }
}
