import type { Metadata } from 'next'
import CalorieCalculatorClient from '@/app/calorie-calculator/CalorieCalculatorClient'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'
import { getProductImageUrls } from '@/lib/product-images'
import { supabase } from '@/lib/supabase'

type NutritionProductRow = {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  is_free: boolean
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null
}

type NutritionProduct = {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  calories: number
  imageUrl: string | null
}

export const metadata: Metadata = {
  title: 'حاسبة السعرات الحرارية',
  description:
    'احسب احتياجك اليومي من السعرات الحرارية في المعضل واعرف النظام الغذائي الأقرب لك من منتجات التغذية المتاحة داخل المتجر.',
  alternates: {
    canonical: '/calorie-calculator',
  },
}

function normalizeRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function extractCaloriesFromTitle(title: string) {
  const match = title.match(/(\d{4})/)
  return match ? Number(match[1]) : null
}

export default async function CalorieCalculatorPage() {
  const { data } = await supabase
    .from('products')
    .select('id, title, slug, description, price, is_free, categories(name, slug)')
    .eq('is_active', true)
    .order('price', { ascending: true })

  const nutritionRows = ((data ?? []) as NutritionProductRow[])
    .map(product => ({
      ...product,
      categories: normalizeRelation(product.categories),
    }))
    .filter(product => product.categories?.slug === 'nutrition' && !product.is_free)

  const imageMap = await getProductImageUrls(
    nutritionRows.map(product => ({
      id: product.id,
      slug: product.slug,
    })),
  )

  const nutritionProducts = nutritionRows
    .map(product => {
      const calories = extractCaloriesFromTitle(product.title)

      if (!calories) {
        return null
      }

      return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        calories,
        imageUrl: imageMap.get(product.id) ?? null,
      } satisfies NutritionProduct
    })
    .filter((product): product is NutritionProduct => Boolean(product))
    .sort((a, b) => a.calories - b.calories)

  return (
    <div className="storefront-shell">
      <StorefrontHeader
        showBlogLink
        actions={[
          { href: '/store?category=nutrition', label: 'أنظمة التغذية', variant: 'muted' },
          { href: '/store', label: 'المتجر', variant: 'primary' },
        ]}
      />

      <CalorieCalculatorClient nutritionProducts={nutritionProducts} />

      <StorefrontFooter note="احسب احتياجك اليومي ثم ابدأ من أقرب نظام غذائي متاح داخل المتجر." />
    </div>
  )
}
