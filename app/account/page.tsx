import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AccountNavLink from '@/app/components/AccountNavLink'
import SignOutButton from '@/app/account/SignOutButton'
import { getCustomerAccountByEmail } from '@/lib/customer-account'
import { requireCustomerUser } from '@/lib/account-auth'

export const dynamic = 'force-dynamic'

const statusTheme: Record<string, { label: string; className: string }> = {
  paid: { label: 'مدفوع', className: 'is-paid' },
  pending: { label: 'قيد المعالجة', className: 'is-pending' },
  failed: { label: 'فشل', className: 'is-failed' },
}

export default async function AccountPage() {
  const user = await requireCustomerUser()

  if (!user.email) {
    redirect('/account/login')
  }

  let orders = [] as Awaited<ReturnType<typeof getCustomerAccountByEmail>>['orders']
  let downloads = [] as Awaited<ReturnType<typeof getCustomerAccountByEmail>>['downloads']
  let customerName: string | null = null
  let hasLoadError = false

  try {
    const accountData = await getCustomerAccountByEmail(user.email)
    customerName = accountData.customerName
    orders = accountData.orders
    downloads = accountData.downloads
  } catch (error) {
    hasLoadError = true
    console.error('Account page load error:', error)
  }

  const displayName =
    customerName?.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email.split('@')[0]

  const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0)

  const formattedOrders = orders.map(order => ({
    ...order,
    formattedDate: new Intl.DateTimeFormat('ar-SA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(order.createdAt)),
  }))

  const formattedDownloads = downloads.map(download => ({
    ...download,
    formattedDate: new Intl.DateTimeFormat('ar-SA', {
      dateStyle: 'medium',
    }).format(new Date(download.createdAt)),
  }))

  return (
    <div className="account-page-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .account-page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 28%),
            #fafafa;
          color: #1a1a1a;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .account-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.85rem;
          padding: 0.82rem 1.2rem;
          border-bottom: 1px solid rgba(17, 17, 17, 0.07);
          background-color: rgba(250, 250, 250, 0.92);
          backdrop-filter: blur(14px);
        }

        .account-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
        }

        .account-brand span {
          font-size: 1.16rem;
          font-weight: 900;
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .account-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          flex-wrap: wrap;
        }

        .account-nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0.55rem 0.85rem;
          border-radius: 12px;
          border: 1px solid #ececec;
          background: rgba(255, 255, 255, 0.9);
          color: #555;
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .account-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1.25rem 1.15rem 3.5rem;
        }

        .account-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1rem;
          margin-bottom: 1.2rem;
        }

        .account-eyebrow {
          display: inline-flex;
          margin-bottom: 0.6rem;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          background: rgba(184, 145, 46, 0.12);
          color: #8f6a14;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .account-title {
          margin: 0 0 0.5rem;
          font-size: clamp(1.9rem, 4vw, 2.7rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .account-title strong {
          color: #b8912e;
        }

        .account-subtitle {
          max-width: 680px;
          margin: 0;
          color: #757575;
          font-size: 0.96rem;
          line-height: 1.8;
        }

        .account-summary {
          min-width: 280px;
          padding: 1rem;
          border: 1px solid rgba(184, 145, 46, 0.18);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 16px 28px rgba(17, 17, 17, 0.05);
        }

        .account-summary-email {
          margin: 0 0 0.35rem;
          color: #555;
          font-size: 0.9rem;
          font-weight: 700;
          word-break: break-word;
        }

        .account-summary-name {
          margin: 0 0 0.8rem;
          color: #1a1a1a;
          font-size: 1.04rem;
          font-weight: 900;
        }

        .account-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.6rem;
          margin-bottom: 0.85rem;
        }

        .account-summary-stat {
          padding: 0.75rem 0.7rem;
          border-radius: 14px;
          background: #fcfbf8;
          text-align: center;
        }

        .account-summary-stat strong {
          display: block;
          margin-bottom: 0.18rem;
          color: #b8912e;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .account-summary-stat span {
          color: #7b7b7b;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .account-section {
          margin-top: 1.1rem;
        }

        .account-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.9rem;
          flex-wrap: wrap;
        }

        .account-section-head h2 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .account-section-head p {
          margin: 0;
          color: #7d7d7d;
          font-size: 0.88rem;
        }

        .account-empty {
          padding: 2rem 1.2rem;
          border: 1px dashed #ddd;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          text-align: center;
          color: #8b8b8b;
          line-height: 1.8;
        }

        .account-empty a {
          color: #b8912e;
          font-weight: 800;
          text-decoration: none;
        }

        .account-error {
          padding: 1rem 1.1rem;
          border: 1px solid #fecaca;
          border-radius: 18px;
          background: #fef2f2;
          color: #dc2626;
          line-height: 1.8;
          margin-bottom: 1rem;
        }

        .account-orders {
          display: grid;
          gap: 0.85rem;
        }

        .account-order-card {
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 14px 28px rgba(17, 17, 17, 0.04);
          overflow: hidden;
        }

        .account-order-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1rem 0.85rem;
        }

        .account-order-id {
          display: inline-flex;
          margin-bottom: 0.28rem;
          color: #1a1a1a;
          font-size: 1rem;
          font-weight: 900;
        }

        .account-order-date {
          margin: 0;
          color: #8c8c8c;
          font-size: 0.8rem;
        }

        .account-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .account-status.is-paid {
          background: #ecfdf3;
          color: #15803d;
        }

        .account-status.is-pending {
          background: #fff8e7;
          color: #8f6a14;
        }

        .account-status.is-failed {
          background: #fef2f2;
          color: #dc2626;
        }

        .account-order-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          padding: 0 1rem 1rem;
        }

        .account-order-meta div {
          padding: 0.8rem 0.75rem;
          border-radius: 16px;
          background: #fcfbf8;
        }

        .account-order-meta span {
          display: block;
          margin-bottom: 0.2rem;
          color: #8f8f8f;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .account-order-meta strong {
          color: #1a1a1a;
          font-size: 0.96rem;
          font-weight: 800;
        }

        .account-order-details {
          border-top: 1px solid #f2f2f2;
        }

        .account-order-details summary {
          list-style: none;
          cursor: pointer;
          padding: 0.95rem 1rem;
          font-size: 0.9rem;
          font-weight: 800;
          color: #b8912e;
        }

        .account-order-details summary::-webkit-details-marker {
          display: none;
        }

        .account-order-details[open] summary {
          border-bottom: 1px solid #f2f2f2;
        }

        .account-order-products {
          display: grid;
          gap: 0.8rem;
          padding: 0.95rem 1rem 1rem;
        }

        .account-order-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.7rem;
          padding: 0 1rem 1rem;
          flex-wrap: wrap;
        }

        .account-order-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0.68rem 0.95rem;
          border-radius: 12px;
          border: 1px solid #e7e7e7;
          background: #fff;
          color: #444;
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 800;
        }

        .account-product-card {
          padding: 0.95rem;
          border-radius: 18px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
        }

        .account-product-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.7rem;
        }

        .account-product-head h3 {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 800;
          line-height: 1.5;
        }

        .account-product-head a {
          color: #1a1a1a;
          text-decoration: none;
        }

        .account-product-price {
          color: #b8912e;
          font-size: 0.88rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .account-product-files {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
        }

        .account-download-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0.65rem 0.95rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 800;
          box-shadow: 0 12px 18px rgba(184, 145, 46, 0.18);
        }

        .account-download-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 0.85rem;
        }

        .account-download-card {
          padding: 1rem;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 14px 28px rgba(17, 17, 17, 0.04);
        }

        .account-download-badge {
          display: inline-flex;
          margin-bottom: 0.55rem;
          padding: 0.26rem 0.65rem;
          border-radius: 999px;
          background: #fff8e7;
          color: #8f6a14;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .account-download-card h3 {
          margin: 0 0 0.35rem;
          font-size: 0.98rem;
          font-weight: 800;
          line-height: 1.5;
        }

        .account-download-card p {
          margin: 0;
          color: #7e7e7e;
          font-size: 0.82rem;
          line-height: 1.7;
        }

        .account-download-card .account-download-button {
          width: 100%;
          margin-top: 0.85rem;
        }

        @media (max-width: 860px) {
          .account-hero {
            flex-direction: column;
            align-items: stretch;
          }

          .account-summary {
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .account-nav {
            gap: 0.6rem;
            padding: 0.72rem 0.9rem;
          }

          .account-brand span {
            font-size: 0.98rem;
          }

          .account-nav-link {
            font-size: 0.82rem;
          }

          .account-main {
            padding: 0.95rem 0.8rem 2.8rem;
          }

          .account-title {
            font-size: 1.62rem;
          }

          .account-subtitle {
            font-size: 0.9rem;
          }

          .account-summary {
            padding: 0.9rem;
          }

          .account-summary-grid,
          .account-order-meta {
            grid-template-columns: 1fr;
          }

          .account-order-head,
          .account-product-head {
            flex-direction: column;
          }

          .account-order-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .account-order-link {
            width: 100%;
          }

          .account-download-grid {
            grid-template-columns: 1fr;
          }

          .account-download-button {
            width: 100%;
          }
        }
      `}</style>

      <nav className="account-nav">
        <Link href="/" className="account-brand">
          <Image src="/logo.png" alt="المعضل" width={48} height={48} />
          <span>المعضل</span>
        </Link>

        <div className="account-nav-actions">
          <AccountNavLink className="account-nav-link" />
          <Link href="/store" className="account-nav-link">
            ← المتجر
          </Link>
        </div>
      </nav>

      <main className="account-main">
        <section className="account-hero">
          <div>
            <span className="account-eyebrow">حسابي</span>
            <h1 className="account-title">
              أهلاً <strong>{displayName}</strong>
            </h1>
            <p className="account-subtitle">
              جمعنا آخر الطلبات، التنزيلات، وروابط الوصول في مكان واحد بالاعتماد
              على نفس البريد الإلكتروني الذي استخدمته عند الطلب.
            </p>
          </div>

          <div className="account-summary">
            <p className="account-summary-name">{displayName}</p>
            <p className="account-summary-email">{user.email}</p>

            <div className="account-summary-grid">
              <div className="account-summary-stat">
                <strong>{formattedOrders.length}</strong>
                <span>طلبات</span>
              </div>
              <div className="account-summary-stat">
                <strong>{formattedDownloads.length}</strong>
                <span>تحميلات</span>
              </div>
              <div className="account-summary-stat">
                <strong>{totalSpent}</strong>
                <span>ريال</span>
              </div>
            </div>

            <SignOutButton />
          </div>
        </section>

        <section className="account-section" id="orders">
          <div className="account-section-head">
            <div>
              <h2>مشترياتي</h2>
              <p>طلباتك السابقة مع حالة كل طلب وروابط التحميل وصفحة تفاصيل مستقلة.</p>
            </div>
            <p>{formattedOrders.length} طلب</p>
          </div>

          {hasLoadError && (
            <div className="account-error">
              تعذر تحميل بيانات الحساب الآن. أعد المحاولة بعد قليل، وإذا استمرت
              المشكلة فتأكد من استخدام نفس البريد الإلكتروني الذي أتممت به الطلب.
            </div>
          )}

          {formattedOrders.length === 0 ? (
            <div className="account-empty">
              لا توجد طلبات مرتبطة بهذا البريد حالياً.
              <br />
              <Link href="/store">تصفّح المتجر</Link>
            </div>
          ) : (
            <div className="account-orders">
              {formattedOrders.map(order => {
                const status = statusTheme[order.status] || {
                  label: order.status,
                  className: 'is-pending',
                }

                return (
                  <article key={order.id} className="account-order-card">
                    <div className="account-order-head">
                      <div>
                        <span className="account-order-id">#{order.shortId}</span>
                        <p className="account-order-date">{order.formattedDate}</p>
                      </div>
                      <span className={`account-status ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="account-order-meta">
                      <div>
                        <span>المبلغ</span>
                        <strong>{order.amount === 0 ? 'مجاني' : `${order.amount} ريال`}</strong>
                      </div>
                      <div>
                        <span>المنتجات</span>
                        <strong>{order.products.length}</strong>
                      </div>
                      <div>
                        <span>التحميلات</span>
                        <strong>
                          {order.products.reduce(
                            (sum, product) => sum + product.downloads.length,
                            0,
                          )}
                        </strong>
                      </div>
                    </div>

                    <details className="account-order-details">
                      <summary>عرض التفاصيل</summary>

                      <div className="account-order-products">
                        {order.products.map(product => (
                          <div key={product.id} className="account-product-card">
                            <div className="account-product-head">
                              <div>
                                {product.slug ? (
                                  <Link href={`/store/${product.slug}`}>
                                    <h3>{product.title}</h3>
                                  </Link>
                                ) : (
                                  <h3>{product.title}</h3>
                                )}
                              </div>

                              <span className="account-product-price">
                                {product.pricePaid === 0 ? 'مجاني' : `${product.pricePaid} ريال`}
                              </span>
                            </div>

                            {product.downloads.length > 0 ? (
                              <div className="account-product-files">
                                {product.downloads.map(download => (
                                  <a
                                    key={download.id}
                                    href={download.url}
                                    className="account-download-button"
                                  >
                                    تحميل {download.title}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="account-order-date">
                                لا توجد ملفات متاحة لهذا العنصر حالياً.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>

                    <div className="account-order-actions">
                      <span className="account-order-date">
                        يمكنك إدارة التحميلات والتقييمات من صفحة هذا الطلب.
                      </span>
                      <Link href={`/account/orders/${order.id}`} className="account-order-link">
                        فتح صفحة الطلب
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="account-section">
          <div className="account-section-head">
            <div>
              <h2>التحميلات</h2>
              <p>كل ملفاتك الجاهزة للتحميل السريع من نفس الروابط الآمنة الحالية.</p>
            </div>
            <p>{formattedDownloads.length} ملف</p>
          </div>

          {formattedDownloads.length === 0 ? (
            <div className="account-empty">
              لا توجد ملفات مرتبطة بهذا البريد بعد.
              <br />
              بعد إتمام الطلبات ستظهر روابط التحميل هنا تلقائيًا.
            </div>
          ) : (
            <div className="account-download-grid">
              {formattedDownloads.map(download => (
                <article key={download.id} className="account-download-card">
                  <span className="account-download-badge">طلب #{download.orderShortId}</span>
                  <h3>{download.title}</h3>
                  <p>{download.productTitle}</p>
                  <p>{download.formattedDate}</p>
                  <a href={download.url} className="account-download-button">
                    إعادة التحميل
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
