import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة',
  description: 'الرابط الذي تحاول الوصول إليه غير موجود في المعضل.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="not-found-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .not-found-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          background:
            radial-gradient(circle at top right, rgba(212, 168, 67, 0.1), transparent 28%),
            #fafafa;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .not-found-card {
          width: min(100%, 620px);
          padding: 2rem 1.4rem;
          border: 1px solid rgba(17, 17, 17, 0.06);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 34px rgba(17, 17, 17, 0.06);
          text-align: center;
        }

        .not-found-code {
          display: inline-flex;
          margin-bottom: 0.9rem;
          padding: 0.38rem 0.85rem;
          border-radius: 999px;
          background: rgba(184, 145, 46, 0.12);
          color: #8f6a14;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .not-found-visual {
          font-size: 3.2rem;
          margin-bottom: 0.9rem;
        }

        .not-found-card h1 {
          margin: 0 0 0.55rem;
          color: #1a1a1a;
          font-size: clamp(1.7rem, 4vw, 2.35rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .not-found-card p {
          max-width: 460px;
          margin: 0 auto;
          color: #777;
          font-size: 0.96rem;
          line-height: 1.85;
        }

        .not-found-actions {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1.4rem;
        }

        .not-found-primary,
        .not-found-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0.75rem 1.2rem;
          border-radius: 14px;
          text-decoration: none;
          font-size: 0.94rem;
          font-weight: 800;
        }

        .not-found-primary {
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
          box-shadow: 0 14px 24px rgba(184, 145, 46, 0.22);
        }

        .not-found-secondary {
          border: 1px solid #e7e7e7;
          background: #fff;
          color: #555;
        }

        @media (max-width: 640px) {
          .not-found-card {
            padding: 1.7rem 1rem;
            border-radius: 22px;
          }

          .not-found-visual {
            font-size: 2.6rem;
          }

          .not-found-card p {
            font-size: 0.9rem;
          }

          .not-found-primary,
          .not-found-secondary {
            width: 100%;
          }
        }
      `}</style>

      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <div className="not-found-visual">🧭</div>
        <h1>الصفحة غير موجودة</h1>
        <p>
          الرابط الذي فتحته غير متوفر حالياً. يمكنك العودة إلى المتجر أو الصفحة الرئيسية
          ومتابعة التصفح من هناك.
        </p>

        <div className="not-found-actions">
          <Link href="/store" className="not-found-primary">
            الذهاب إلى المتجر
          </Link>
          <Link href="/" className="not-found-secondary">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
