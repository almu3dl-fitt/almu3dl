import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabase'
import {
  STORE_CATALOG_CACHE_TAG,
  STORE_DATA_REVALIDATE_SECONDS,
} from '@/lib/storefront-cache'

export type StoreCategory = {
  id: string
  name: string
  slug: string
}

type StoreCategoryRelation = {
  name: string
  slug: string
}

export type StoreProductRow = {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  is_free: boolean
  level: string
  tags: string[] | null
  category_id: string | null
  categories: StoreCategoryRelation | StoreCategoryRelation[] | null
}

export type StoreProduct = Omit<StoreProductRow, 'categories'> & {
  categories: StoreCategoryRelation | null
}

function normalizeRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

const getStoreCategoriesCached = unstable_cache(
  async () => {
    const { data } = await supabase.from('categories').select('id, name, slug').order('name')
    return ((data ?? []) as StoreCategory[])
  },
  ['store-categories'],
  {
    revalidate: STORE_DATA_REVALIDATE_SECONDS,
    tags: [STORE_CATALOG_CACHE_TAG],
  },
)

const getActiveStoreProductsCached = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('products')
      .select('id, slug, title, description, price, is_free, level, tags, category_id, categories(name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return ((data ?? []) as StoreProductRow[]).map(product => ({
      ...product,
      categories: normalizeRelation(product.categories),
    })) as StoreProduct[]
  },
  ['active-store-products'],
  {
    revalidate: STORE_DATA_REVALIDATE_SECONDS,
    tags: [STORE_CATALOG_CACHE_TAG],
  },
)

export async function getStoreCategories() {
  return getStoreCategoriesCached()
}

export async function getActiveStoreProducts() {
  return getActiveStoreProductsCached()
}

export async function getActiveProductBySlug(slug: string) {
  const products = await getActiveStoreProducts()
  return products.find(product => product.slug === slug) ?? null
}
