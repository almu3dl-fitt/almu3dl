import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StorefrontContentPage from '@/app/components/StorefrontContentPage'
import { getActiveStoreProducts, type StoreProduct } from '@/lib/store-catalog'
import { buildAbsoluteUrl, siteConfig, truncateText } from '@/lib/site'
import { getStoreLandingPage, storeLandingPages } from '@/lib/store-landing-pages'

type LandingPageParams = {
  slug: string
}

export function generateStaticParams() {
  return storeLandingPages.map(page => ({ slug: page.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LandingPageParams>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getStoreLandingPage(slug)

  if (!page) {
    return {
      title: 'الصفحة غير موجودة',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: page.metadataTitle,
    description: page.metadataDescription,
    alternates: {
      canonical: buildAbsoluteUrl(`/programs/${page.slug}`),
    },
    openGraph: {
      title: `${page.metadataTitle} | ${siteConfig.name}`,
      description: page.metadataDescription,
      url: buildAbsoluteUrl(`/programs/${page.slug}`),
      type: 'article',
      locale: 'ar_SA',
    },
  }
}

export default async function StoreLandingPage({
  params,
}: {
  params: Promise<LandingPageParams>
}) {
  const { slug } = await params
  const page = getStoreLandingPage(slug)

  if (!page) {
    return notFound()
  }

  const products = await getActiveStoreProducts()
  const productMap = new Map(products.map(product => [product.slug, product] as const))
  const featuredProducts = page.productSlugs
    .map(productSlug => productMap.get(productSlug))
    .filter((product): product is StoreProduct => Boolean(product))

  const landingStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'الرئيسية',
          item: buildAbsoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'المتجر',
          item: buildAbsoluteUrl('/store'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: page.metadataTitle,
          item: buildAbsoluteUrl(`/programs/${page.slug}`),
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: page.metadataTitle,
      url: buildAbsoluteUrl(`/programs/${page.slug}`),
      description: page.metadataDescription,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: featuredProducts.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: buildAbsoluteUrl(`/store/${product.slug}`),
          name: product.title,
        })),
      },
    },
  ]

  const cards = featuredProducts.map(product => ({
    title: product.title,
    description: `${product.is_free ? 'مجاني' : `${product.price} ريال`} — ${truncateText(product.description?.trim() || 'برنامج رقمي جاهز مع خطوات أوضح للبدء.', 110)}`,
    href: `/store/${product.slug}`,
    linkLabel: 'عرض المنتج',
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingStructuredData) }}
      />

      <StorefrontContentPage
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        headerActions={page.headerActions}
        heroActions={page.heroActions}
        cards={cards}
        sections={page.sections}
        footerNote={page.footerNote}
      />
    </>
  )
}
