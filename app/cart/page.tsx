import CartPageClient, { type CartRecommendation } from '@/app/cart/CartPageClient'
import { getProductImageUrls } from '@/lib/product-images'
import { getActiveStoreProducts } from '@/lib/store-catalog'

export default async function CartPage() {
  const products = await getActiveStoreProducts()
  const productImageUrls = await getProductImageUrls(
    products.map(product => ({
      id: product.id,
      slug: product.slug,
    })),
  )

  const recommendationProducts: CartRecommendation[] = products.map(product => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    is_free: product.is_free,
    categorySlug: product.categories?.slug ?? 'bundles',
    categoryName: product.categories?.name ?? 'برنامج رقمي',
    description: product.description,
    imageUrl: productImageUrls.get(product.id) ?? null,
  }))

  return <CartPageClient recommendationProducts={recommendationProducts} />
}
