import Image from 'next/image'
import Link from 'next/link'

type HomeFeaturedProductCardProps = {
  href: string
  title: string
  description: string
  categoryLabel: string
  priceLabel: string
  ctaLabel: string
  badge: string
  accentLabel: string
  imageUrl?: string | null
}

export default function HomeFeaturedProductCard({
  href,
  title,
  description,
  categoryLabel,
  priceLabel,
  ctaLabel,
  badge,
  accentLabel,
  imageUrl,
}: HomeFeaturedProductCardProps) {
  return (
    <Link href={href} className="home-product-card">
      <div className="home-product-card-media">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1120px) 50vw, 25vw"
            className="home-product-card-image"
          />
        ) : (
          <span className="home-product-card-fallback">{badge}</span>
        )}
        <span className="home-product-card-badge">{accentLabel}</span>
      </div>

      <div className="home-product-card-body">
        <div className="home-product-card-meta">
          <span>{categoryLabel}</span>
          <span>{priceLabel}</span>
        </div>

        <h3>{title}</h3>
        <p>{description}</p>

        <div className="home-product-card-footer">
          <strong>{ctaLabel}</strong>
          <span>←</span>
        </div>
      </div>
    </Link>
  )
}
