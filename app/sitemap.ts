import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getSiteUrl } from '@/lib/site'

type SitemapProduct = {
  slug: string
  created_at: string | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const { data: products } = await supabase
    .from('products')
    .select('slug, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/store`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/calorie-calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
  ]

  const productRoutes: MetadataRoute.Sitemap = ((products ?? []) as SitemapProduct[]).map(
    product => ({
      url: `${siteUrl}/store/${product.slug}`,
      lastModified: product.created_at ? new Date(product.created_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
  )

  return [...staticRoutes, ...productRoutes]
}
