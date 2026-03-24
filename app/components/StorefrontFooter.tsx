'use client'

export default function StorefrontFooter({
  note = 'واجهة عربية واضحة، شراء سريع، وتجربة تحميل موثوقة.',
}: {
  note?: string
}) {
  return (
    <footer className="storefront-footer">
      <div className="storefront-footer-inner">
        <p className="storefront-footer-copy">
          © {new Date().getFullYear()} المعضل. جميع الحقوق محفوظة.
        </p>
        <p className="storefront-footer-note">{note}</p>
      </div>
    </footer>
  )
}
