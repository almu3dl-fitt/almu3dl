import Image from 'next/image'

export default function BrandMark() {
  return (
    <>
      <span className="storefront-brand-mark" aria-hidden="true">
        <Image src="/logo.png" alt="" width={42} height={42} />
      </span>
      <span className="storefront-brand-copy">
        <span className="storefront-brand-title">المعضل</span>
        <span className="storefront-brand-tagline">Premium Fitness Store</span>
      </span>
    </>
  )
}
