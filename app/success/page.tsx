import Image from 'next/image'
import Link from 'next/link'
import AccountNavLink from '@/app/components/AccountNavLink'
import SuccessCartCleanup from '@/app/components/SuccessCartCleanup'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

type SuccessOrder = {
  status: string | null
  customer_name: string | null
  customer_email: string | null
  amount: number | null
}

type SuccessOrderItem = {
  id: string
  price_paid: number
  products: { title: string } | { title: string }[] | null
}

type SuccessDownload = {
  id: string
  token: string
  order_item_id: string
  product_files: { file_name: string } | { file_name: string }[] | null
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const params = await searchParams
  const orderId = params.order

  if (!orderId) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "var(--font-tajawal), Arial, sans-serif",
          direction: 'rtl',
        }}
      >
        <p style={{ color: '#999' }}>لا يوجد طلب</p>
      </div>
    )
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      id,
      price_paid,
      products ( title )
    `)
    .eq('order_id', orderId)

  const safeOrder = (order as SuccessOrder | null) ?? null
  const safeOrderItems = (orderItems as SuccessOrderItem[] | null) ?? []
  const itemIds = safeOrderItems.map(item => item.id)

  const { data: downloads } = itemIds.length
    ? await supabase
        .from('downloads')
        .select(`
          id,
          token,
          order_item_id,
          product_files ( file_name )
        `)
        .in('order_item_id', itemIds)
    : { data: [] as SuccessDownload[] }

  const safeDownloads = (downloads as SuccessDownload[] | null) ?? []
  const itemMap = new Map<string, SuccessOrderItem>(
    safeOrderItems.map(item => [item.id, item])
  )

  const isPaid = safeOrder?.status === 'paid'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        fontFamily: "var(--font-tajawal), 'Arial', sans-serif",
        direction: 'rtl',
      }}
    >
      {isPaid && <SuccessCartCleanup />}

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          borderBottom: '1px solid #eee',
          backgroundColor: 'rgba(250,250,250,0.95)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
          }}
        >
          <Image
            src="/logo.png"
            alt="المعضل"
            width={55}
            height={55}
            style={{ objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: '1.3rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #B8912E, #D4A843)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            المعضل
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
          <AccountNavLink className="success-nav-link" />
          <Link
            href="/store"
            className="success-nav-link"
          >
            ← المتجر
          </Link>
        </div>
      </nav>

      <style>{`
        .success-nav-link {
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
          font-size: 0.88rem;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .success-nav-link {
            font-size: 0.82rem;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}
      >
        {isPaid ? (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem',
              }}
            >
              ✅
            </div>

            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
                color: '#1a1a1a',
              }}
            >
              تم الطلب بنجاح!
            </h1>

            <p
              style={{
                color: '#777',
                marginBottom: '0.5rem',
                fontSize: '1rem',
              }}
            >
              شكراً لك {safeOrder?.customer_name}
            </p>

            <p
              style={{
                color: '#999',
                marginBottom: '2.5rem',
                fontSize: '0.9rem',
              }}
            >
              تم إرسال الفاتورة وروابط التحميل على {safeOrder?.customer_email}
            </p>

            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #eee',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '2rem',
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#FAFAFA',
                  borderBottom: '1px solid #eee',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                📦 ملفاتك
              </div>

              {safeDownloads.map((download, i) => {
                const item = itemMap.get(download.order_item_id)
                const itemProduct = Array.isArray(item?.products)
                  ? item.products[0]
                  : item?.products

                const file = Array.isArray(download.product_files)
                  ? download.product_files[0]
                  : download.product_files

                const fileName = file?.file_name || 'ملف التحميل'
                const cleanFileName = fileName.replace(/\.pdf$/i, '')

                return (
                  <div
                    key={`${download.order_item_id}-${fileName}-${i}`}
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom:
                        i < safeDownloads.length - 1 ? '1px solid #f5f5f5' : 'none',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          marginBottom: '0.25rem',
                          color: '#1a1a1a',
                        }}
                      >
                        {cleanFileName}
                      </p>

                      <p style={{ fontSize: '0.8rem', color: '#999' }}>
                        {itemProduct?.title}
                      </p>
                    </div>

                    <a
                      href={`/api/download/${download.token}?download=${download.id}`}
                      style={{
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      ⬇️ حمّل
                    </a>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '2rem',
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ color: '#777', fontSize: '0.9rem' }}>
                  رقم الطلب
                </span>
                <span style={{ fontSize: '0.8rem', color: '#555' }}>
                  {orderId.slice(0, 8)}...
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ color: '#777', fontSize: '0.9rem' }}>المجموع</span>
                <span style={{ fontWeight: 700, color: '#B8912E' }}>
                  {safeOrder?.amount === 0 ? 'مجاني' : `${safeOrder?.amount} ريال`}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#777', fontSize: '0.9rem' }}>الحالة</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>
                  ✅ مدفوع
                </span>
              </div>
            </div>

            <Link
              href="/store"
              style={{
                background: 'linear-gradient(135deg, #D4A843, #B8912E)',
                color: '#fff',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              تصفّح برامج أخرى
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
              }}
            >
              الطلب قيد المعالجة
            </h1>

            <p style={{ color: '#999', marginBottom: '2rem' }}>
              جاري تأكيد الدفع وتجهيز ملفاتك. لا تغلق الصفحة، وإذا دفعت بالفعل
              فسيظهر المحتوى الكامل هنا خلال لحظات.
            </p>

            <Link
              href="/store"
              style={{
                color: '#B8912E',
                textDecoration: 'underline',
                fontSize: '0.95rem',
              }}
            >
              رجوع للمتجر
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
