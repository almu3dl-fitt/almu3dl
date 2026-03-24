import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'

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
  const spotlightMetrics = [
    { value: `${productsCount}+`, label: 'برنامج رقمي جاهز' },
    { value: `${categories?.length ?? 0}`, label: 'مسارات تدريب وغذاء' },
    { value: '15+', label: 'سنة خبرة عملية' },
  ]
  const trustHighlights = [
    { title: 'رحلة شراء مختصرة', text: 'تنقل واضح من الاكتشاف حتى السلة والدفع بدون تشتيت.' },
    { title: 'هوية احترافية', text: 'تصميم عربي جاد يعزز الثقة ويعكس قيمة المحتوى الرقمي.' },
    { title: 'بدء سريع', text: 'الوصول للمنتجات يتم فورًا بعد الإتمام لتبدأ في نفس اليوم.' },
  ]
  const socialLinks = [
    { label: 'TikTok', href: 'https://tiktok.com/@almu3dl' },
    { label: 'Instagram', href: 'https://instagram.com/bin_zain' },
    { label: 'YouTube', href: 'https://youtube.com/@almu3dl' },
    { label: 'X', href: 'https://x.com/almu3dl' },
  ]

  return (
    <div className="home-page-shell storefront-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .home-page-shell {
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .home-hero {
          position: relative;
          padding: 2rem 1rem 0;
        }

        .home-hero-content {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.82fr);
          gap: 1rem;
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
        }

        .home-hero-main,
        .home-hero-side,
        .home-section-card,
        .home-about-card,
        .home-cta-banner {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--store-border);
          border-radius: var(--store-radius-xl);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-shadow);
        }

        .home-hero-main {
          padding: 3rem;
        }

        .home-hero-main::before,
        .home-hero-side::before,
        .home-section-card::before,
        .home-about-card::before,
        .home-cta-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), transparent 85%);
          pointer-events: none;
        }

        .home-hero-main::after {
          content: '';
          position: absolute;
          inset: auto auto -120px -80px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224, 180, 72, 0.22), transparent 70%);
          pointer-events: none;
        }

        .home-hero-copy {
          position: relative;
          z-index: 1;
        }

        .home-hero-eyebrow {
          display: inline-flex;
          margin-bottom: 1rem;
          letter-spacing: 0.18em;
        }

        .home-hero h1 {
          margin: 0 0 1.05rem;
          max-width: 700px;
          color: var(--store-text);
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900;
          line-height: 1.08;
        }

        .home-hero-highlight {
          background: linear-gradient(135deg, #fff0bf, var(--store-accent), #c58814);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .home-hero p {
          max-width: 620px;
          margin: 0 0 1.75rem;
          color: var(--store-text-muted);
          font-size: 1.02rem;
          line-height: 1.8;
        }

        .home-hero-actions {
          display: flex;
          gap: 0.8rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .home-hero-primary,
        .home-hero-secondary {
          min-width: 176px;
        }

        .home-hero-primary {
          background: linear-gradient(135deg, #ffe18a, var(--store-accent));
          color: #111;
        }

        .home-hero-secondary {
          border-color: var(--store-border-strong);
          color: var(--store-text);
        }

        .home-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .home-stat {
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
        }

        .home-stat strong {
          display: block;
          margin-bottom: 0.28rem;
          color: var(--store-accent-strong);
          font-size: 1.65rem;
          font-weight: 900;
        }

        .home-stat span {
          color: var(--store-text-soft);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .home-hero-side {
          padding: 1.25rem;
          display: grid;
          gap: 0.9rem;
          align-content: start;
        }

        .home-hero-side-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          min-height: 34px;
          padding: 0.35rem 0.78rem;
          border-radius: 999px;
          border: 1px solid var(--store-border);
          background: rgba(255, 255, 255, 0.04);
          color: var(--store-text-muted);
          font-size: 0.78rem;
          font-weight: 800;
        }

        .home-side-card {
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
        }

        .home-side-card strong {
          display: block;
          margin-bottom: 0.45rem;
          color: var(--store-text);
          font-size: 1rem;
          font-weight: 900;
        }

        .home-side-card p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.84rem;
          line-height: 1.8;
        }

        .home-marquee {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 1rem auto 0;
          padding: 0.9rem 1rem;
          border: 1px solid var(--store-border);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          color: var(--store-text-muted);
          font-size: 0.82rem;
          font-weight: 800;
          line-height: 1.8;
          text-align: center;
        }

        .home-section {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding-top: 1rem;
        }

        .home-section-head {
          margin-bottom: 1.4rem;
        }

        .home-section-head h2 {
          margin: 0 0 0.45rem;
          color: var(--store-text);
          font-size: 2rem;
          font-weight: 900;
        }

        .home-section-head p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.95rem;
        }

        .home-section-card {
          padding: 1.4rem;
        }

        .home-categories,
        .home-proof-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .home-category {
          display: block;
          padding: 1.5rem 1.2rem;
          border: 1px solid var(--store-border);
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01)),
            rgba(255, 255, 255, 0.02);
          text-decoration: none;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .home-category:hover,
        .home-proof-card:hover {
          transform: translateY(-3px);
          border-color: var(--store-border-strong);
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.24);
        }

        .home-category-icon {
          width: 62px;
          height: 62px;
          margin-bottom: 1rem;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(255, 230, 160, 0.16), rgba(224, 180, 72, 0.07));
          color: var(--store-accent-strong);
          font-size: 1.95rem;
        }

        .home-category h3 {
          margin: 0 0 0.55rem;
          color: var(--store-text);
          font-size: 1.08rem;
          font-weight: 800;
        }

        .home-category p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.86rem;
          line-height: 1.75;
        }

        .home-proof-card {
          padding: 1.2rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .home-proof-card span {
          display: inline-flex;
          margin-bottom: 0.8rem;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.78rem;
          font-weight: 800;
        }

        .home-proof-card h3 {
          margin: 0 0 0.45rem;
          color: var(--store-text);
          font-size: 1rem;
          font-weight: 900;
        }

        .home-proof-card p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.84rem;
          line-height: 1.8;
        }

        .home-about {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1rem 0 0;
        }

        .home-about-card {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          gap: 1rem;
          padding: 1.5rem;
          align-items: center;
        }

        .home-about-visual {
          display: grid;
          place-items: center;
          min-height: 320px;
          border: 1px solid var(--store-border);
          border-radius: 26px;
          background:
            radial-gradient(circle, rgba(224, 180, 72, 0.2), rgba(224, 180, 72, 0.03) 44%, transparent 68%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01)),
            rgba(255, 255, 255, 0.03);
        }

        .home-about-visual img {
          width: 168px;
          height: 168px;
          object-fit: contain;
          filter: drop-shadow(0 18px 42px rgba(224, 180, 72, 0.2));
        }

        .home-about h2 {
          margin: 0 0 0.75rem;
          color: var(--store-text);
          font-size: 2rem;
          font-weight: 900;
        }

        .home-about p {
          margin: 0 0 1.25rem;
          color: var(--store-text-muted);
          font-size: 1rem;
          line-height: 1.9;
        }

        .home-socials {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .home-socials a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0.65rem 1rem;
          border: 1px solid var(--store-border);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          color: var(--store-text);
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 800;
        }

        .home-cta {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1rem 0 0;
        }

        .home-cta-banner {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
          padding: 1.5rem;
        }

        .home-cta-banner h2 {
          margin: 0 0 0.35rem;
          color: var(--store-text);
          font-size: 1.75rem;
          font-weight: 900;
        }

        .home-cta-banner p {
          margin: 0;
          color: var(--store-text-muted);
          line-height: 1.8;
        }

        .home-cta-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        @media (max-width: 980px) {
          .home-hero-content,
          .home-about-card {
            grid-template-columns: 1fr;
          }

          .home-about-visual {
            min-height: 240px;
          }
        }

        @media (max-width: 640px) {
          .home-hero {
            padding-top: 1rem;
          }

          .home-hero-content,
          .home-marquee,
          .home-section,
          .home-about,
          .home-cta {
            width: min(calc(100% - 1rem), var(--store-content-width));
          }

          .home-hero-main,
          .home-hero-side,
          .home-section-card,
          .home-about-card,
          .home-cta-banner {
            padding: 1rem;
          }

          .home-hero-primary,
          .home-hero-secondary {
            width: 100%;
          }

          .home-stats,
          .home-proof-grid {
            grid-template-columns: 1fr;
          }

          .home-section-head h2,
          .home-about h2,
          .home-cta-banner h2 {
            font-size: 1.45rem;
          }

          .home-cta-banner {
            align-items: stretch;
            flex-direction: column;
          }

          .home-cta-actions {
            width: 100%;
            flex-direction: column;
          }

          .home-cta-actions a {
            width: 100%;
          }
        }
      `}</style>

      <StorefrontHeader
        actions={[
          { href: '/store', label: 'المتجر', variant: 'muted' },
          { href: '/store', label: 'تسوق الآن', variant: 'primary' },
        ]}
      />

      <section className="home-hero">
        <div className="home-hero-content">
          <article className="home-hero-main storefront-grid-accent">
            <div className="home-hero-copy">
              <span className="home-hero-eyebrow storefront-pill">PERFORMANCE-FIRST STORE</span>

              <h1>
                متجر رقمي بطابع
                <br />
                <span className="home-hero-highlight">رياضي فاخر</span>
                <br />
                لنتائج تبدأ اليوم
              </h1>

              <p>
                برامج تغذية وتمارين وعناية علاجية مصممة بلغة عربية واضحة وهوية
                قوية، مع تجربة شراء مختصرة وواثقة من لحظة الاكتشاف حتى التحميل.
              </p>

              <div className="home-hero-actions">
                <Link href="/store" className="home-hero-primary storefront-button-primary">
                  تسوق الآن
                </Link>
                <Link
                  href="/store?free=true"
                  className="home-hero-secondary storefront-button-secondary"
                >
                  اكتشف المجاني
                </Link>
              </div>

              <div className="home-stats">
                {spotlightMetrics.map((stat, index) => (
                  <div key={index} className="home-stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <aside className="home-hero-side storefront-grid-accent">
            <span className="home-hero-side-label">ثقة ووضوح</span>
            <div className="home-side-card">
              <strong>مبني للتحويل</strong>
              <p>
                زرّ الشراء واضح، الأسعار بارزة، والهوية البصرية مصممة لتدعم
                القرار بدل ما تشتته.
              </p>
            </div>
            <div className="home-side-card">
              <strong>واجهة عربية أولًا</strong>
              <p>
                تباين عالٍ، هرمية قوية، ومسافات متوازنة تجعل التصفح أسهل على
                الجوال والكمبيوتر.
              </p>
            </div>
            <div className="home-side-card">
              <strong>قيمة واضحة من أول شاشة</strong>
              <p>
                أقسام سريعة، رحلة شراء مباشرة، ومحتوى يبدو احترافيًا من أول
                انطباع.
              </p>
            </div>
          </aside>
        </div>

        <div className="home-marquee">
          الوصول فوري بعد الإتمام • واجهة عربية عالية التباين • تصنيف ذكي حسب
          الهدف والمستوى • هوية رياضية حديثة تبني الثقة
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>الأقسام الرئيسية</h2>
          <p>نظمنا المتجر إلى مسارات واضحة تساعد العميل يصل للبرنامج المناسب بسرعة.</p>
        </div>

        <div className="home-section-card storefront-grid-accent">
          <div className="home-categories">
            {categories?.map(cat => (
              <Link key={cat.id} href={`/store?category=${cat.slug}`} className="home-category">
                <div className="home-category-icon">
                  {categoryIcons[cat.name] || '📁'}
                </div>
                <h3>{cat.name}</h3>
                <p>{categoryDescriptions[cat.name] || 'برامج رقمية مصممة لتبدأ بسرعة وتلتزم أكثر.'}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>لماذا تبدو التجربة أفضل الآن؟</h2>
          <p>لأن المتجر لم يعد مجرد قائمة منتجات، بل واجهة بيع احترافية لهوية لياقة عربية.</p>
        </div>

        <div className="home-section-card storefront-grid-accent">
          <div className="home-proof-grid">
            {trustHighlights.map((item, index) => (
              <article key={index} className="home-proof-card">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-about">
        <div className="home-about-card storefront-grid-accent">
          <div className="home-about-visual">
            <Image src="/logo.png" alt="المعضل" width={168} height={168} />
          </div>

          <div>
            <span className="storefront-pill">عن المعضل</span>
            <h2>خبرة عملية وهوية واضحة</h2>

            <p>
              بعد أكثر من 15 سنة في الرياضة والنظام الصحي، أصبحت باحثًا ومطّلعًا
              في كل ما يخص اللياقة والتغذية، مع شهادات NASAM وISSA. الهدف هنا
              ليس فقط بيع برنامج، بل تقديم تجربة تبدو احترافية، موثوقة، وسهلة
              البدء.
            </p>

            <div className="home-socials">
              {socialLinks.map((social, index) => (
                <a key={index} href={social.href} target="_blank" rel="noopener noreferrer">
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="home-cta-banner storefront-grid-accent">
          <div>
            <span className="storefront-pill">ابدأ اليوم</span>
            <h2>جهّز خطتك القادمة بثوانٍ</h2>
            <p>
              اختر القسم، استعرض البرامج، وأضف ما يناسبك إلى السلة ضمن تجربة
              شراء عربية مصممة للثقة والتحويل.
            </p>
          </div>

          <div className="home-cta-actions">
            <Link href="/store" className="storefront-button-primary">
              اكتشف الآن
            </Link>
            <Link href="/store?free=true" className="storefront-button-secondary">
              ابدأ بالمجاني
            </Link>
          </div>
        </div>
      </section>

      <StorefrontFooter note="متجر عربي بطابع رياضي فاخر، مصمم لرفع الثقة وتحسين التحويل." />
    </div>
  )
}
