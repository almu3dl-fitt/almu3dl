import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import AccountNavLink from '@/app/components/AccountNavLink'
import ProductReviewForm from '@/app/components/ProductReviewForm'
import { requireCustomerUser } from '@/lib/account-auth'
import { getCustomerOrderById } from '@/lib/customer-account'

type OrderDetailParams = {
  id: string
}

const statusTheme: Record<string, { label: string; background: string; color: string }> = {
  paid: { label: 'مدفوع', background: '#ecfdf3', color: '#15803d' },
  pending: { label: 'قيد المعالجة', background: '#fff8e7', color: '#8f6a14' },
  failed: { label: 'فشل', background: '#fef2f2', color: '#dc2626' },
}

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<OrderDetailParams>
}) {
  const user = await requireCustomerUser()

  if (!user.email) {
    redirect('/account/login')
  }

  const { id } = await params
  const order = await getCustomerOrderById(user.email, id)

  if (!order) {
    notFound()
  }

  const status = statusTheme[order.status] || statusTheme.pending
  const formattedDate = new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.createdAt))

  const totalDownloads = order.products.reduce(
    (sum, product) => sum + product.downloads.length,
    0,
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 28%), #fafafa',
        color: '#1a1a1a',
        fontFamily: "var(--font-tajawal), 'Arial', sans-serif",
        direction: 'rtl',
      }}
    >
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.82rem 1.2rem',
          borderBottom: '1px solid rgba(17, 17, 17, 0.07)',
          backgroundColor: 'rgba(250, 250, 250, 0.92)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
          }}
        >
          <Image src="/logo.png" alt="المعضل" width={48} height={48} />
          <span
            style={{
              fontSize: '1.16rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #b8912e, #d4a843)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            المعضل
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
          <AccountNavLink className="account-order-nav-link" />
          <Link href="/account" className="account-order-nav-link">
            ← حسابي
          </Link>
        </div>
      </nav>

      <main
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '1.15rem 1rem 3rem',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <style>{`
          .account-order-nav-link {
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

          @media (max-width: 640px) {
            .account-order-nav-link {
              font-size: 0.82rem;
            }
          }
        `}</style>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.82fr)',
            gap: '1rem',
          }}
        >
          <article
            style={{
              padding: '1.1rem',
              borderRadius: '24px',
              border: '1px solid rgba(17, 17, 17, 0.06)',
              background: 'rgba(255, 255, 255, 0.96)',
              boxShadow: '0 16px 28px rgba(17, 17, 17, 0.05)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                marginBottom: '0.65rem',
                padding: '0.34rem 0.72rem',
                borderRadius: '999px',
                background: 'rgba(184, 145, 46, 0.12)',
                color: '#8f6a14',
                fontSize: '0.76rem',
                fontWeight: 800,
              }}
            >
              تفاصيل الطلب
            </span>
            <h1 style={{ margin: '0 0 0.45rem', fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 900 }}>
              الطلب #{order.shortId}
            </h1>
            <p style={{ margin: 0, color: '#777', lineHeight: 1.8 }}>
              ستجد هنا المنتجات التي اشتريتها، الملفات المرتبطة بها، وإمكانية
              تقييم كل منتج اشتريته من هذا الطلب.
            </p>
          </article>

          <aside
            style={{
              padding: '1rem',
              borderRadius: '22px',
              border: '1px solid rgba(184, 145, 46, 0.18)',
              background: '#fff',
              boxShadow: '0 16px 28px rgba(17, 17, 17, 0.05)',
            }}
          >
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <span style={{ display: 'block', color: '#8a8a8a', fontSize: '0.8rem', fontWeight: 700 }}>
                  العميل
                </span>
                <strong style={{ color: '#1a1a1a', fontSize: '1rem', fontWeight: 900 }}>
                  {order.customerName || user.email}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8a8a8a', fontSize: '0.8rem', fontWeight: 700 }}>
                  البريد
                </span>
                <strong style={{ color: '#1a1a1a', fontSize: '0.95rem', fontWeight: 800, wordBreak: 'break-word' }}>
                  {order.customerEmail || user.email}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8a8a8a', fontSize: '0.8rem', fontWeight: 700 }}>
                  الحالة
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '34px',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    background: status.background,
                    color: status.color,
                    fontSize: '0.8rem',
                    fontWeight: 900,
                  }}
                >
                  {status.label}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8a8a8a', fontSize: '0.8rem', fontWeight: 700 }}>
                  التاريخ
                </span>
                <strong style={{ color: '#1a1a1a', fontSize: '0.95rem', fontWeight: 800 }}>
                  {formattedDate}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8a8a8a', fontSize: '0.8rem', fontWeight: 700 }}>
                  المبلغ
                </span>
                <strong style={{ color: '#b8912e', fontSize: '1.2rem', fontWeight: 900 }}>
                  {order.amount === 0 ? 'مجاني' : `${order.amount} ريال`}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8a8a8a', fontSize: '0.8rem', fontWeight: 700 }}>
                  الملفات
                </span>
                <strong style={{ color: '#1a1a1a', fontSize: '0.95rem', fontWeight: 800 }}>
                  {totalDownloads} ملف
                </strong>
              </div>
            </div>
          </aside>
        </section>

        <section style={{ display: 'grid', gap: '0.9rem' }}>
          {order.products.map(product => (
            <article
              key={product.id}
              style={{
                borderRadius: '22px',
                border: '1px solid rgba(17, 17, 17, 0.06)',
                background: '#fff',
                boxShadow: '0 14px 26px rgba(17, 17, 17, 0.04)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.9rem',
                  padding: '1rem 1rem 0.85rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  {product.slug ? (
                    <Link href={`/store/${product.slug}`} style={{ color: '#1a1a1a', textDecoration: 'none' }}>
                      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.02rem', fontWeight: 900 }}>
                        {product.title}
                      </h2>
                    </Link>
                  ) : (
                    <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.02rem', fontWeight: 900 }}>
                      {product.title}
                    </h2>
                  )}
                  <p style={{ margin: 0, color: '#8a8a8a', fontSize: '0.82rem' }}>
                    {product.pricePaid === 0 ? 'مجاني' : `${product.pricePaid} ريال`}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.downloads.length > 0 ? (
                    product.downloads.map(download => (
                      <a
                        key={download.id}
                        href={download.url}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '40px',
                          padding: '0.65rem 0.95rem',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #d4a843, #b8912e)',
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                        }}
                      >
                        تحميل {download.title}
                      </a>
                    ))
                  ) : (
                    <span style={{ color: '#9a9a9a', fontSize: '0.82rem' }}>
                      لا توجد ملفات متاحة لهذا العنصر حالياً.
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  padding: '0 1rem 1rem',
                  display: 'grid',
                  gap: '0.8rem',
                }}
              >
                {order.status === 'paid' ? (
                  <ProductReviewForm
                    orderId={order.id}
                    productId={product.productId}
                    productTitle={product.title}
                    initialReview={
                      product.review
                        ? {
                            id: product.review.id,
                            rating: product.review.rating,
                            comment: product.review.comment,
                            status: product.review.status,
                          }
                        : null
                    }
                  />
                ) : (
                  <div
                    style={{
                      padding: '0.85rem 0.95rem',
                      borderRadius: '16px',
                      border: '1px solid #eee',
                      background: '#fafafa',
                      color: '#787878',
                      fontSize: '0.82rem',
                      lineHeight: 1.8,
                    }}
                  >
                    ستتمكن من تقييم هذا المنتج بعد اكتمال حالة الطلب ونجاح الدفع.
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <style>{`
          @media (max-width: 860px) {
            main section:first-of-type {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </div>
  )
}
