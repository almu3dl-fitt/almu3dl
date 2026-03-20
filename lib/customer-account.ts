import { supabaseAdmin } from '@/lib/supabase-admin'

type OrderProductRelation = {
  id: string
  title: string
  slug: string
} | {
  id: string
  title: string
  slug: string
}[] | null

type AccountOrderItemRow = {
  id: string
  product_id: string
  price_paid: number | null
  products: OrderProductRelation
}

type AccountOrderRow = {
  id: string
  amount: number | null
  status: string | null
  customer_name: string | null
  customer_email: string | null
  created_at: string
  order_items: AccountOrderItemRow[] | null
}

type AccountDownloadRow = {
  id: string
  token: string
  order_item_id: string
  product_files: { file_name: string } | { file_name: string }[] | null
}

export type CustomerDownload = {
  id: string
  orderItemId: string
  fileName: string
  title: string
  url: string
  productTitle: string
  productSlug: string | null
  orderId: string
  orderShortId: string
  createdAt: string
  status: string
  amount: number
}

export type CustomerOrderProduct = {
  id: string
  productId: string
  title: string
  slug: string | null
  pricePaid: number
  downloads: CustomerDownload[]
}

export type CustomerOrder = {
  id: string
  shortId: string
  createdAt: string
  status: string
  amount: number
  products: CustomerOrderProduct[]
}

export type CustomerOrderReview = {
  id: string
  rating: number
  comment: string
  status: string
  createdAt: string
}

export type CustomerOrderDetailProduct = CustomerOrderProduct & {
  review: CustomerOrderReview | null
}

export type CustomerOrderDetail = Omit<CustomerOrder, 'products'> & {
  customerName: string | null
  customerEmail: string | null
  products: CustomerOrderDetailProduct[]
}

type ReviewRow = {
  id: string
  product_id: string
  rating: number
  comment: string | null
  status: string
  created_at: string
}

function normalizeProductRelation(productRelation: OrderProductRelation) {
  return Array.isArray(productRelation) ? productRelation[0] : productRelation
}

function mapOrders(
  safeOrders: AccountOrderRow[],
  safeDownloads: AccountDownloadRow[],
  reviewMap?: Map<string, ReviewRow>,
): CustomerOrderDetail[] {
  const downloadsByItem = new Map<string, AccountDownloadRow[]>()

  safeDownloads.forEach(download => {
    const existing = downloadsByItem.get(download.order_item_id) ?? []
    existing.push(download)
    downloadsByItem.set(download.order_item_id, existing)
  })

  return safeOrders.map(order => ({
    id: order.id,
    shortId: order.id.slice(0, 8),
    createdAt: order.created_at,
    status: order.status || 'pending',
    amount: Number(order.amount ?? 0),
    customerName: order.customer_name?.trim() || null,
    customerEmail: order.customer_email?.trim() || null,
    products: (order.order_items ?? []).map(item => {
      const product = normalizeProductRelation(item.products)
      const itemDownloads = (downloadsByItem.get(item.id) ?? []).map(download => {
        const file = Array.isArray(download.product_files)
          ? download.product_files[0]
          : download.product_files
        const fileName = file?.file_name || 'ملف التحميل'

        return {
          id: download.id,
          orderItemId: item.id,
          fileName,
          title: fileName.replace(/\.(pdf|zip|mp4)$/i, ''),
          url: `/api/download/${download.token}?download=${download.id}`,
          productTitle: product?.title || 'منتج رقمي',
          productSlug: product?.slug || null,
          orderId: order.id,
          orderShortId: order.id.slice(0, 8),
          createdAt: order.created_at,
          status: order.status || 'pending',
          amount: Number(order.amount ?? 0),
        }
      })

      const review = reviewMap?.get(item.product_id) ?? null

      return {
        id: item.id,
        productId: item.product_id,
        title: product?.title || 'منتج رقمي',
        slug: product?.slug || null,
        pricePaid: Number(item.price_paid ?? 0),
        downloads: itemDownloads,
        review: review
          ? {
              id: review.id,
              rating: Number(review.rating ?? 0),
              comment: review.comment?.trim() || '',
              status: review.status,
              createdAt: review.created_at,
            }
          : null,
      }
    }),
  }))
}

async function getOrdersByEmail(email: string) {
  return supabaseAdmin
    .from('orders')
    .select(`
      id,
      amount,
      status,
      customer_name,
      customer_email,
      created_at,
      order_items (
        id,
        product_id,
        price_paid,
        products ( id, title, slug )
      )
    `)
    .ilike('customer_email', email.trim())
    .order('created_at', { ascending: false })
}

async function getDownloadsByOrderItemIds(orderItemIds: string[]) {
  if (!orderItemIds.length) {
    return { data: [] as AccountDownloadRow[], error: null }
  }

  return supabaseAdmin
    .from('downloads')
    .select('id, token, order_item_id, product_files(file_name)')
    .in('order_item_id', orderItemIds)
}

export async function getCustomerAccountByEmail(email: string) {
  const { data: orders, error: ordersError } = await getOrdersByEmail(email)

  if (ordersError) {
    console.error('Customer account orders error:', ordersError)
  }

  const safeOrders = (orders as AccountOrderRow[] | null) ?? []
  const orderItemIds = safeOrders.flatMap(order => order.order_items?.map(item => item.id) ?? [])

  const { data: downloads, error: downloadsError } = await getDownloadsByOrderItemIds(orderItemIds)

  if (downloadsError) {
    console.error('Customer account downloads error:', downloadsError)
  }

  const safeDownloads = (downloads as AccountDownloadRow[] | null) ?? []
  const mappedOrders = mapOrders(safeOrders, safeDownloads)

  const downloadsList = mappedOrders.flatMap(order =>
    order.products.flatMap(product => product.downloads),
  )

  const customerName =
    mappedOrders.find(order => order.customerName)?.customerName?.trim() || null

  return {
    customerName,
    orders: mappedOrders as CustomerOrder[],
    downloads: downloadsList,
  }
}

export async function getCustomerOrderById(email: string, orderId: string) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      amount,
      status,
      customer_name,
      customer_email,
      created_at,
      order_items (
        id,
        product_id,
        price_paid,
        products ( id, title, slug )
      )
    `)
    .eq('id', orderId)
    .ilike('customer_email', email.trim())
    .single()

  if (orderError) {
    console.error('Customer order detail error:', orderError)
    return null
  }

  const safeOrder = (order as AccountOrderRow | null) ?? null

  if (!safeOrder) {
    return null
  }

  const orderItemIds = safeOrder.order_items?.map(item => item.id) ?? []
  const productIds = safeOrder.order_items?.map(item => item.product_id) ?? []

  const [{ data: downloads, error: downloadsError }, { data: reviews, error: reviewsError }] =
    await Promise.all([
      getDownloadsByOrderItemIds(orderItemIds),
      productIds.length
        ? supabaseAdmin
            .from('product_reviews')
            .select('id, product_id, rating, comment, status, created_at')
            .in('product_id', productIds)
            .ilike('customer_email', email.trim())
        : Promise.resolve({ data: [] as ReviewRow[], error: null }),
    ])

  if (downloadsError) {
    console.error('Customer order downloads error:', downloadsError)
  }

  if (reviewsError) {
    if (reviewsError.code !== 'PGRST205') {
      console.error('Customer order reviews error:', reviewsError)
    }
  }

  const reviewMap = new Map<string, ReviewRow>()

  ;((reviews as ReviewRow[] | null) ?? []).forEach(review => {
    reviewMap.set(review.product_id, review)
  })

  const [mappedOrder] = mapOrders([safeOrder], (downloads as AccountDownloadRow[] | null) ?? [], reviewMap)
  return mappedOrder ?? null
}
