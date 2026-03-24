'use client'

export default function StorefrontFooter({
  note = 'برامج رقمية في التغذية والتمارين والتأهيل مع شراء آمن ووصول مباشر.',
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
