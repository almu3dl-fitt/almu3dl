import Image from 'next/image'

export default function BrandMark({
  size = 'md',
  showCopy = true,
}: {
  size?: 'md' | 'lg'
  showCopy?: boolean
}) {
  const imageSize = size === 'lg' ? 56 : 42
  const mark = (
    <span className={['storefront-brand-mark', size === 'lg' ? 'is-lg' : ''].filter(Boolean).join(' ')} aria-hidden="true">
      <Image src="/logo.png" alt="" width={imageSize} height={imageSize} />
    </span>
  )

  if (!showCopy) {
    return mark
  }

  return (
    <>
      {mark}
      <span className="storefront-brand-copy">
        <span className="storefront-brand-title">Almu3dl - المعضّل</span>
        <span className="storefront-brand-tagline">
          منصة للّياقة والتغذية والأداء الرياضي
        </span>
      </span>
    </>
  )
}
