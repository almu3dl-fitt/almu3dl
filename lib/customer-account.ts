import { supabaseAdmin } from '@/lib/supabase-admin'

type OrderProductRelation = {
  title: string
  slug: string
} | {
  title: string
  slug: string
}[] | null

type AccountOrderItemRow = {
  id: string
  price_paid: number | null
  products: OrderProductRelation
}

type AccountOrderRow = {
  id: string
  amount: number | null
  status: string | null
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

export async function getCustomerAccountByEmail(email: string) {
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      amount,
      status,
      created_at,
      order_items (
        id,
        price_paid,
        products ( title, slug )
      )
    `)
    .ilike('customer_email', email.trim())
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Customer account orders error:', ordersError)
  }

  const safeOrders = (orders as AccountOrderRow[] | null) ?? []
  const orderItemIds = safeOrders.flatMap(order => order.order_items?.map(item => item.id) ?? [])

  const { data: downloads, error: downloadsError } = orderItemIds.length
    ? await supabaseAdmin
        .from('downloads')
        .select('id, token, order_item_id, product_files(file_name)')
        .in('order_item_id', orderItemIds)
    : { data: [] as AccountDownloadRow[] }

  if (downloadsError) {
    console.error('Customer account downloads error:', downloadsError)
  }

  const safeDownloads = (downloads as AccountDownloadRow[] | null) ?? []
  const downloadsByItem = new Map<string, AccountDownloadRow[]>()

  safeDownloads.forEach(download => {
    const existing = downloadsByItem.get(download.order_item_id) ?? []
    existing.push(download)
    downloadsByItem.set(download.order_item_id, existing)
  })

  const mappedOrders: CustomerOrder[] = safeOrders.map(order => ({
    id: order.id,
    shortId: order.id.slice(0, 8),
    createdAt: order.created_at,
    status: order.status || 'pending',
    amount: Number(order.amount ?? 0),
    products: (order.order_items ?? []).map(item => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
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

      return {
        id: item.id,
        title: product?.title || 'منتج رقمي',
        slug: product?.slug || null,
        pricePaid: Number(item.price_paid ?? 0),
        downloads: itemDownloads,
      }
    }),
  }))

  const downloadsList = mappedOrders.flatMap(order =>
    order.products.flatMap(product => product.downloads),
  )

  return {
    orders: mappedOrders,
    downloads: downloadsList,
  }
}
