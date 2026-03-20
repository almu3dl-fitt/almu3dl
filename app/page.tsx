import Image from 'next/image'
import CartIcon from '@/app/components/CartIcon'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)

  const categoryIcons: Record<string, string> = {
    'الانظمة الغذائية': '🥗',
    'الانظمة الرياضية': '🏋🏻',
    'الانظمة العلاجية': '🩺',
    'الباقات': '📦',
  }

  const categoryDescriptions: Record<string, string> = {
    'الانظمة الغذائية': 'أنظمة غذائية مرنة محسوبة السعرات تناسب أهدافك',
    'الانظمة الرياضية': 'برامج تمارين مصممة لكل المستويات',
    'الانظمة العلاجية': 'تمارين علاجية متخصصة للآلام والإصابات',
    'الباقات': 'باقات شاملة بسعر مخفّض',
  }

  const productsCount = products?.length ?? 0

  return (
    <div className="home-page-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .home-page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(212, 168, 67, 0.08), transparent 30%),
            #fafafa;
          color: #1a1a1a;
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .home-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1.4rem;
          border-bottom: 1px solid rgba(17, 17, 17, 0.07);
          background-color: rgba(250, 250, 250, 0.92);
          backdrop-filter: blur(14px);
        }

        .home-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
        }

        .home-brand img {
          width: 54px;
          height: 54px;
          object-fit: contain;
        }

        .home-brand span {
          font-size: 1.22rem;
          font-weight: 900;
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .home-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .home-nav-link {
          color: #555;
          text-decoration: none;
          font-size: 0.93rem;
          font-weight: 700;
        }

        .home-nav-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0.65rem 1rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .home-hero {
          position: relative;
          overflow: hidden;
          padding: 4rem 1.4rem 3.1rem;
          background-color: #111;
          color: #fff;
          text-align: center;
        }

        .home-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(184,145,46,0.12) 0%, transparent 52%),
            linear-gradient(225deg, rgba(184,145,46,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 50%, rgba(184,145,46,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 50%, rgba(212,168,67,0.06) 0%, transparent 60%);
          pointer-events: none;
        }

        .home-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.01) 40px,
            rgba(255,255,255,0.01) 41px
          );
          pointer-events: none;
        }

        .home-hero-content {
          position: relative;
          z-index: 1;
          max-width: 980px;
          margin: 0 auto;
        }

        .home-hero-eyebrow {
          display: inline-flex;
          margin-bottom: 0.9rem;
          color: #b8912e;
          font-size: 0.84rem;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .home-hero h1 {
          margin: 0 auto 1rem;
          max-width: 760px;
          font-size: clamp(2rem, 5vw, 3.3rem);
          font-weight: 900;
          line-height: 1.25;
        }

        .home-hero-highlight {
          background: linear-gradient(135deg, #b8912e, #d4a843);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .home-hero p {
          max-width: 620px;
          margin: 0 auto 2rem;
          color: #b3b3b3;
          font-size: 1.05rem;
          line-height: 1.8;
        }

        .home-hero-actions {
          display: flex;
          justify-content: center;
          gap: 0.85rem;
          margin-bottom: 2.2rem;
          flex-wrap: wrap;
        }

        .home-hero-primary,
        .home-hero-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          padding: 0.85rem 1.5rem;
          border-radius: 14px;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 800;
        }

        .home-hero-primary {
          background: linear-gradient(135deg, #d4a843, #b8912e);
          color: #fff;
        }

        .home-hero-secondary {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .home-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem;
          max-width: 760px;
          margin: 0 auto;
        }

        .home-stat {
          padding: 1rem 0.9rem;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .home-stat strong {
          display: block;
          margin-bottom: 0.2rem;
          color: #b8912e;
          font-size: 1.5rem;
          font-weight: 900;
        }

        .home-stat span {
          color: #a0a0a0;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .home-section {
          max-width: 1040px;
          margin: 0 auto;
          padding: 3.2rem 1.2rem;
        }

        .home-section-head {
          margin-bottom: 1.8rem;
          text-align: center;
        }

        .home-section-head h2 {
          margin: 0 0 0.6rem;
          font-size: 1.75rem;
          font-weight: 900;
        }

        .home-section-head p {
          margin: 0;
          color: #8a8a8a;
          font-size: 0.98rem;
        }

        .home-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1rem;
        }

        .home-category {
          display: block;
          padding: 1.7rem 1.25rem;
          border: 1px solid #eee;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 12px 24px rgba(17, 17, 17, 0.04);
          text-align: center;
          text-decoration: none;
        }

        .home-category-icon {
          margin-bottom: 0.75rem;
          font-size: 2.35rem;
        }

        .home-category h3 {
          margin: 0 0 0.45rem;
          color: #1a1a1a;
          font-size: 1.05rem;
          font-weight: 800;
        }

        .home-category p {
          margin: 0;
          color: #8e8e8e;
          font-size: 0.84rem;
          line-height: 1.7;
        }

        .home-about {
          max-width: 760px;
          margin: 0 auto;
          padding: 3.2rem 1.2rem;
          text-align: center;
        }

        .home-about img {
          width: 120px;
          height: 120px;
          object-fit: contain;
          margin: 0 auto 1.4rem;
          display: block;
          filter: drop-shadow(0 4px 12px rgba(184,145,46,0.2));
        }

        .home-about h2 {
          margin: 0 0 0.9rem;
          font-size: 1.7rem;
          font-weight: 900;
        }

        .home-about p {
          margin: 0 0 1.4rem;
          color: #777;
          font-size: 1rem;
          line-height: 1.9;
        }

        .home-socials {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .home-socials a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0.55rem 1rem;
          border: 1px solid #eee;
          border-radius: 12px;
          background: #fff;
          color: #b8912e;
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 800;
        }

        .home-footer {
          padding: 1.8rem 1.2rem;
          border-top: 1px solid #eee;
          background: #fff;
          color: #bbb;
          font-size: 0.8rem;
          text-align: center;
        }

        @media (max-width: 720px) {
          .home-nav-link {
            display: none;
          }

          .home-stats {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .home-nav {
            padding: 0.8rem 1rem;
          }

          .home-brand img {
            width: 46px;
            height: 46px;
          }

          .home-brand span {
            font-size: 1.05rem;
          }

          .home-nav-actions {
            gap: 0.65rem;
          }

          .home-nav-cta {
            min-height: 38px;
            padding-inline: 0.85rem;
            font-size: 0.84rem;
          }

          .home-hero {
            padding: 3.15rem 0.95rem 2.5rem;
          }

          .home-hero p {
            margin-bottom: 1.5rem;
            font-size: 0.96rem;
          }

          .home-hero-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 0.7rem;
          }

          .home-hero-primary,
          .home-hero-secondary {
            width: 100%;
          }

          .home-section,
          .home-about {
            padding: 2.6rem 0.95rem;
          }

          .home-section-head h2,
          .home-about h2 {
            font-size: 1.45rem;
          }
        }
      `}</style>

      <nav className="home-nav">
        <Link href="/" className="home-brand">
          <Image src="/logo.png" alt="المعضل" width={54} height={54} />
          <span>المعضل</span>
        </Link>

        <div className="home-nav-actions">
          <CartIcon />
          <Link href="/store" className="home-nav-link">
            المتجر
          </Link>
          <Link href="/store" className="home-nav-cta">
            تصفّح البرامج
          </Link>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-hero-eyebrow">CERTIFIED BY NASAM & ISSA</span>

          <h1>
            وش تنتظر؟
            <br />
            <span className="home-hero-highlight">غيّر جسمك</span>، اكتشف مقدرتك
          </h1>

          <p>
            برامج رقمية للياقة والتغذية مصممة للمبتدئين والمتوسطين.
            <br />
            اشترِ، حمّل، وابدأ — بدون تعقيد.
          </p>

          <div className="home-hero-actions">
            <Link href="/store" className="home-hero-primary">
              تصفّح البرامج
            </Link>
            <Link href="/store?free=true" className="home-hero-secondary">
              كتاب مجاني 🎁
            </Link>
          </div>

          <div className="home-stats">
            {[
              { number: `${productsCount}+`, label: 'برنامج جاهز' },
              { number: '15+', label: 'سنة خبرة' },
              { number: 'NASAM', label: 'شهادة معتمدة' },
            ].map((stat, i) => (
              <div key={i} className="home-stat">
                <strong>{stat.number}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>الأقسام</h2>
          <p>اختر القسم اللي يناسب هدفك بدون ما تتوه داخل المحتوى.</p>
        </div>

        <div className="home-categories">
          {categories?.map(cat => (
            <Link key={cat.id} href={`/store?category=${cat.slug}`} className="home-category">
              <div className="home-category-icon">
                {categoryIcons[cat.name] || '📁'}
              </div>
              <h3>{cat.name}</h3>
              <p>{categoryDescriptions[cat.name] || ''}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-about">
        <Image src="/logo.png" alt="المعضل" width={54} height={54} />

        <h2>عن المعضل</h2>

        <p>
          بعد أكثر من 15 سنة في الرياضة والنظام الصحي، أصبحت باحث ومطّلع في كل ما يخص اللياقة والتغذية. حاصل على شهادات NASAM و ISSA.
          هدفي أوصل المعلومة الصحيحة لأكبر عدد وأساعدك توصل لأفضل نسخة من نفسك.
        </p>

        <div className="home-socials">
          {[
            { label: 'TikTok', href: 'https://tiktok.com/@almu3dl' },
            { label: 'Instagram', href: 'https://instagram.com/bin_zain' },
            { label: 'YouTube', href: 'https://youtube.com/@almu3dl' },
            { label: 'X', href: 'https://x.com/almu3dl' },
          ].map((social, i) => (
            <a key={i} href={social.href} target="_blank" rel="noopener noreferrer">
              {social.label}
            </a>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <p>© {new Date().getFullYear()} المعضل — Almu3dl. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  )
}
