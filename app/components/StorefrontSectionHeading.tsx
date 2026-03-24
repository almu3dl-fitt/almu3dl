type StorefrontSectionHeadingProps = {
  eyebrow?: string
  title: string
  description: string
  align?: 'start' | 'center'
}

export default function StorefrontSectionHeading({
  eyebrow,
  title,
  description,
  align = 'start',
}: StorefrontSectionHeadingProps) {
  return (
    <div
      className="storefront-section-heading"
      style={{ textAlign: align === 'center' ? 'center' : 'right' }}
    >
      {eyebrow && <span className="storefront-pill">{eyebrow}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}
