import Image from 'next/image'
import Link from 'next/link'
import HomeFeaturedProductCard from '@/app/components/HomeFeaturedProductCard'
import StorefrontFooter from '@/app/components/StorefrontFooter'
import StorefrontHeader from '@/app/components/StorefrontHeader'
import StorefrontSectionHeading from '@/app/components/StorefrontSectionHeading'
import { getProductImageUrls } from '@/lib/product-images'
import { supabase } from '@/lib/supabase'

type HomeCategory = {
  id: string
  name: string
  slug: string
}

type HomeProductRow = {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  is_free: boolean
  level: string
  category_id: string | null
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null
}

type HomeProduct = Omit<HomeProductRow, 'categories'> & {
  categories: { name: string; slug: string } | null
}

function normalizeRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function extractCalories(products: HomeProduct[]) {
  return products
    .map(product => {
      const match = product.title.match(/(\d{4})/)
      return match ? Number(match[1]) : null
    })
    .filter((value): value is number => Number.isFinite(value))
    .sort((a, b) => a - b)
}

export default async function Home() {
  const [{ data: categoryData }, { data: productRows }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('products')
      .select('id, slug, title, description, price, is_free, level, category_id, categories(name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  const categories = ((categoryData ?? []) as HomeCategory[]).filter(category =>
    ['nutrition', 'workouts', 'therapy', 'bundles'].includes(category.slug),
  )

  const products = ((productRows ?? []) as HomeProductRow[]).map(product => ({
    ...product,
    categories: normalizeRelation(product.categories),
  })) as HomeProduct[]

  const paidProducts = products.filter(product => !product.is_free)
  const productsCount = products.length
  const startingPrice =
    paidProducts.length > 0
      ? Math.min(...paidProducts.map(product => Number(product.price)))
      : 0
  const freeOffer = products.find(product => product.is_free) ?? null
  const nutritionProducts = products.filter(product => product.categories?.slug === 'nutrition')
  const nutritionCalories = extractCalories(nutritionProducts)
  const nutritionRange =
    nutritionCalories.length > 1
      ? `${nutritionCalories[0]} - ${nutritionCalories[nutritionCalories.length - 1]}`
      : nutritionCalories[0]
        ? `${nutritionCalories[0]}`
        : null

  const categoryCounts = new Map<string, number>()
  products.forEach(product => {
    const slug = product.categories?.slug
    if (!slug) return
    categoryCounts.set(slug, (categoryCounts.get(slug) ?? 0) + 1)
  })

  const categoryContent: Record<
    string,
    { icon: string; title: string; description: string; href: string; imageUrl?: string }
  > = {
    nutrition: {
      icon: '🥗',
      title: 'أنظمة غذائية مرنة',
      description: nutritionRange
        ? `خيارات سعرات تبدأ من ${nutritionRange} سعرة لتسهيل تنظيم أكلك اليومي بما يناسب هدفك.`
        : 'خطط غذائية رقمية مرتبة تساعدك على ضبط أكلك اليومي بدون تعقيد.',
      href: '/store?category=nutrition',
    },
    workouts: {
      icon: '🏋🏻',
      title: 'برامج تمارين عملية',
      description:
        'من برنامج المبتدئين إلى التحدي في النادي وبرامج مناسبة لمن يريد الاستمرار حتى مع ضغط الوقت.',
      href: '/store?category=workouts',
    },
    therapy: {
      icon: '🩺',
      title: 'تمارين علاجية وتأهيل',
      description:
        'حلول رقمية للظهر والركبة مع باقة تأهيل رياضي لمن يبحث عن خيار أشمل وأكثر ترتيبًا.',
      href: '/store?category=therapy',
    },
    bundles: {
      icon: '📦',
      title: 'باقات تجمع أكثر من حل',
      description:
        'اختيارات موفرة لمن يريد مسارًا أوفر بين التغذية والتمارين أو التأهيل في شراء واحد.',
      href: '/store',
      imageUrl: '/store-legacy-images/bundles-mark.svg',
    },
  }

  const productBySlug = new Map(products.map(product => [product.slug, product] as const))
  const featuredSlugs = [
    'total-transformation',
    'flexible-diet-1500',
    'busy-program',
    'back-therapy',
  ]
  const featuredProducts = featuredSlugs
    .map(slug => productBySlug.get(slug))
    .filter((product): product is HomeProduct => Boolean(product))

  const fallbackProducts = products.filter(
    product => !featuredProducts.some(featured => featured.id === product.id),
  )
  while (featuredProducts.length < 4 && fallbackProducts.length > 0) {
    const nextProduct = fallbackProducts.shift()
    if (nextProduct) {
      featuredProducts.push(nextProduct)
    }
  }

  const featuredProductImages = await getProductImageUrls(
    featuredProducts.map(product => ({
      id: product.id,
      slug: product.slug,
    })),
  )

  const featuredDescriptions: Record<string, string> = {
    'total-transformation':
      'برنامج شامل لمن يريد خطة متكاملة للالتزام والانطلاق بثبات.',
    'flexible-diet-1500':
      'نظام غذائي مرن محسوب السعرات لمن يريد أكلًا منظمًا بدون تعقيد أو قوائم مربكة.',
    'busy-program':
      'برنامج تمرين مناسب لمن يريد الاستمرار حتى مع ضغط العمل وتغيّر أوقات اليوم.',
    'back-therapy':
      'تمارين علاجية رقمية تساعدك على التعامل مع آلام الظهر بخطة عملية ومنظمة.',
    'rehab-bundle':
      'باقة تجمع أكثر من حل علاجي رقمي في خيار واحد.',
  }

  const goalCards = [
    {
      eyebrow: 'قبل الاختيار',
      title: 'احسب احتياجك اليومي أولًا',
      description:
        'أدخل بياناتك الأساسية لتظهر لك سعراتك التقديرية وأقرب نظام غذائي مناسب لهدفك داخل المتجر.',
      href: '/calorie-calculator',
      cta: 'ابدأ الحساب',
    },
    {
      eyebrow: 'تنظيم الأكل',
      title: nutritionRange
        ? `أنظمة مرنة من ${nutritionRange} سعرة`
        : 'أنظمة غذائية مرنة',
      description:
        'إذا كان هدفك ضبط الأكل اليومي بسهولة، ستجد خيارات سعرات واضحة تساعدك تبدأ بخطة أنسب لك.',
      href: '/store?category=nutrition',
      cta: 'استعرض الأنظمة',
    },
    {
      eyebrow: 'بداية واضحة',
      title: 'ابدأ التمرين بدون حيرة',
      description:
        'من برنامج المبتدئين 4 أيام إلى برنامج التحدي في النادي، اختر ما يناسب مستواك الحالي وطريقتك في التمرين.',
      href: '/store/beginner-workout-4days',
      cta: 'ابدأ الآن',
    },
    {
      eyebrow: 'وقت محدود',
      title: 'استمر حتى مع ضغط يومك',
      description:
        'برنامج المشغول وقاطع التمرين مناسبين لمن يريد خطة عملية بدون جداول مرهقة أو التزام معقد.',
      href: '/store/busy-program',
      cta: 'اكتشف البرامج',
    },
    {
      eyebrow: 'تأهيل وحركة',
      title: 'حلول للظهر والركبة والتأهيل',
      description:
        'خيارات علاجية وباقة تأهيل رياضي لمن يبحث عن دعم حركي منظم وواضح.',
      href: '/store?category=therapy',
      cta: 'عرض الحلول',
    },
  ]

  const trustItems = [
    {
      eyebrow: 'اختيار أسهل',
      title: 'منتجات رقمية مرتبة',
      description:
        'تصفح أنظمة التغذية والتمارين والباقات ضمن أقسام واضحة تساعدك على الوصول إلى البرنامج الأنسب لهدفك بسرعة.',
    },
    {
      eyebrow: 'خطوات واضحة',
      title: 'شراء سريع وواضح',
      description:
        'رحلة شراء مباشرة ومنظمة من اختيار البرنامج حتى إتمام الطلب، مع عرض واضح للتفاصيل في كل خطوة.',
    },
    {
      eyebrow: 'وصول منظم',
      title: 'استلام رقمي بعد الطلب',
      description:
        'بعد إتمام الشراء يظهر طلبك بشكل منظم وتبقى روابط الوصول محفوظة داخل حسابك للرجوع إليها وقت الحاجة.',
    },
    {
      eyebrow: 'قيمة مناسبة',
      title: 'خيارات تناسب ميزانيتك',
      description:
        startingPrice > 0
          ? `تبدأ بعض البرامج من ${startingPrice} ريال، مع خيارات متعددة تساعدك على البدء بما يناسب احتياجك وميزانيتك.`
          : 'تتوفر خيارات متنوعة بأسعار واضحة لتسهيل اختيار البرنامج المناسب.',
    },
  ]

  const faqItems = [
    {
      question: 'هل المنتجات في المتجر رقمية؟',
      answer:
        'نعم. المتجر مخصص لبرامج رقمية في التغذية والتمارين والعلاجية والباقات، ويتم الوصول إليها بعد إتمام الطلب.',
    },
    {
      question: 'كيف أستلم طلبي بعد الشراء؟',
      answer:
        'بعد نجاح الطلب يتم إرسال الفاتورة وروابط الوصول إلى بريدك الإلكتروني، كما تظهر الطلبات والتنزيلات داخل حسابك.',
    },
    {
      question: 'هل يوجد محتوى مجاني؟',
      answer: freeOffer
        ? `نعم، يوجد حاليًا ${freeOffer.title} ويمكنك الحصول عليه ضمن رحلة الطلب المجاني.`
        : 'قد تتوفر منتجات مجانية داخل المتجر بحسب العروض الحالية.',
    },
    {
      question: 'هل توجد خيارات تناسب المبتدئين؟',
      answer:
        'نعم. الكتالوج يضم برامج مناسبة للمبتدئين بالإضافة إلى خيارات أخرى بحسب نوع البرنامج والهدف.',
    },
  ]

  return (
    <div className="home-shell storefront-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

        .home-shell {
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
        }

        .home-main {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1.25rem 0 0;
        }

        .storefront-section-heading {
          display: grid;
          gap: 0.55rem;
          margin-bottom: 1.35rem;
        }

        .storefront-section-heading h2 {
          margin: 0;
          color: var(--store-text);
          font-size: clamp(1.65rem, 3vw, 2.25rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .storefront-section-heading p {
          max-width: 760px;
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.95rem;
          line-height: 1.85;
        }

        .home-section {
          margin-top: 1.1rem;
        }

        .home-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(280px, 0.82fr);
          gap: 1rem;
          align-items: stretch;
        }

        .home-hero-main,
        .home-hero-side,
        .home-surface-panel,
        .home-final-cta {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--store-border);
          border-radius: var(--store-radius-xl);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-shadow);
        }

        .home-hero-main::before,
        .home-hero-side::before,
        .home-surface-panel::before,
        .home-final-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.82), transparent 88%);
          pointer-events: none;
        }

        .home-hero-main {
          padding: 2.6rem;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.14), rgba(255, 255, 255, 0.02) 44%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
        }

        .home-hero-main::after {
          content: '';
          position: absolute;
          inset: auto auto -110px -90px;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224, 180, 72, 0.24), transparent 68%);
          pointer-events: none;
        }

        .home-hero-copy {
          position: relative;
          z-index: 1;
        }

        .home-hero-copy h1 {
          margin: 0 0 1rem;
          max-width: 780px;
          color: var(--store-text);
          font-size: clamp(2.35rem, 5vw, 4.3rem);
          font-weight: 900;
          line-height: 1.08;
        }

        .home-hero-highlight {
          background: linear-gradient(135deg, #fff4cc, var(--store-accent-strong), #b98111);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .home-hero-copy p {
          max-width: 680px;
          margin: 0 0 1.5rem;
          color: var(--store-text-muted);
          font-size: 1rem;
          line-height: 1.9;
        }

        .home-hero-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.6rem;
        }

        .home-hero-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .home-hero-stat {
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
        }

        .home-hero-stat strong {
          display: block;
          margin-bottom: 0.3rem;
          color: var(--store-accent-strong);
          font-size: 1.55rem;
          font-weight: 900;
        }

        .home-hero-stat span {
          color: var(--store-text-soft);
          font-size: 0.8rem;
          font-weight: 700;
        }

        .home-hero-side {
          display: grid;
          gap: 0.85rem;
          align-content: start;
          padding: 1.15rem;
        }

        .home-side-card {
          position: relative;
          z-index: 1;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
        }

        .home-side-card span {
          display: inline-flex;
          margin-bottom: 0.7rem;
          padding: 0.32rem 0.72rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--store-text-muted);
          font-size: 0.76rem;
          font-weight: 800;
        }

        .home-side-card h3 {
          margin: 0 0 0.45rem;
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

        .home-strip {
          margin-top: 1rem;
          padding: 0.95rem 1rem;
          border: 1px solid var(--store-border);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          color: var(--store-text-muted);
          font-size: 0.83rem;
          font-weight: 800;
          line-height: 1.8;
          text-align: center;
        }

        .home-surface-panel {
          padding: 1.35rem;
        }

        .home-category-grid,
        .home-product-grid,
        .home-goal-grid,
        .home-trust-grid,
        .home-faq-grid {
          display: grid;
          gap: 1rem;
        }

        .home-category-grid {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .home-category-card,
        .home-goal-card,
        .home-trust-card,
        .home-faq-card {
          position: relative;
          z-index: 1;
          padding: 1.2rem;
          border: 1px solid var(--store-border);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.03);
        }

        .home-category-card {
          display: block;
          text-decoration: none;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .home-category-card:hover,
        .home-product-card:hover,
        .home-goal-card:hover {
          transform: translateY(-3px);
          border-color: var(--store-border-strong);
          box-shadow: 0 18px 32px rgba(0, 0, 0, 0.26);
        }

        .home-category-icon {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          margin-bottom: 0.95rem;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(255, 240, 191, 0.16), rgba(224, 180, 72, 0.08));
          color: var(--store-accent-strong);
          font-size: 1.9rem;
        }

        .home-category-icon.has-image {
          overflow: hidden;
          padding: 0.35rem;
        }

        .home-category-icon-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .home-category-card h3,
        .home-goal-card h3,
        .home-trust-card h3,
        .home-faq-card h3 {
          margin: 0 0 0.45rem;
          color: var(--store-text);
          font-size: 1.02rem;
          font-weight: 900;
          line-height: 1.45;
        }

        .home-category-card p,
        .home-goal-card p,
        .home-trust-card p,
        .home-faq-card p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.85rem;
          line-height: 1.82;
        }

        .home-category-footer,
        .home-goal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.7rem;
          margin-top: 0.9rem;
          color: var(--store-accent-strong);
          font-size: 0.8rem;
          font-weight: 800;
        }

        .home-product-grid {
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        .home-product-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--store-border);
          border-radius: 24px;
          text-decoration: none;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-card-shadow);
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .home-product-card-media {
          position: relative;
          min-height: 250px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.18), rgba(10, 10, 10, 0.2)),
            #0c0e0c;
        }

        .home-product-card-media::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.52)),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 22px,
              rgba(255, 255, 255, 0.05) 22px,
              rgba(255, 255, 255, 0.05) 23px
            );
          pointer-events: none;
        }

        .home-product-card-image {
          object-fit: cover;
        }

        .home-product-card-fallback {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: var(--store-accent-strong);
          font-size: 2.8rem;
          z-index: 1;
        }

        .home-product-card-badge {
          position: absolute;
          top: 0.9rem;
          inset-inline-end: 0.9rem;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(12, 12, 12, 0.42);
          color: #fff;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .home-product-card-body {
          display: grid;
          gap: 0.75rem;
          padding: 1rem;
        }

        .home-product-card-meta {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .home-product-card-meta span {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0.22rem 0.6rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--store-text-soft);
          font-size: 0.72rem;
          font-weight: 800;
        }

        .home-product-card h3 {
          margin: 0;
          color: var(--store-text);
          font-size: 1.05rem;
          font-weight: 900;
          line-height: 1.45;
        }

        .home-product-card p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.84rem;
          line-height: 1.8;
        }

        .home-product-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.7rem;
          margin-top: auto;
          color: var(--store-accent-strong);
          font-size: 0.9rem;
          font-weight: 900;
        }

        .home-goal-grid,
        .home-trust-grid {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .home-goal-card {
          display: block;
          text-decoration: none;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .home-goal-card span,
        .home-trust-card span {
          display: inline-flex;
          margin-bottom: 0.8rem;
          padding: 0.3rem 0.72rem;
          border-radius: 999px;
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
          font-size: 0.76rem;
          font-weight: 800;
        }

        .home-faq-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .home-faq-card h3 {
          font-size: 0.98rem;
        }

        .home-final-cta {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .home-final-cta h2 {
          margin: 0 0 0.4rem;
          color: var(--store-text);
          font-size: 1.85rem;
          font-weight: 900;
        }

        .home-final-cta p {
          margin: 0;
          max-width: 720px;
          color: var(--store-text-muted);
          line-height: 1.85;
        }

        .home-final-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        @media (max-width: 980px) {
          .home-hero,
          .home-faq-grid,
          .home-final-cta {
            grid-template-columns: 1fr;
          }

          .home-final-cta {
            flex-direction: column;
            align-items: stretch;
          }
        }

        @media (max-width: 640px) {
          .home-main {
            width: min(calc(100% - 1rem), var(--store-content-width));
            padding-top: 1rem;
          }

          .home-hero-main,
          .home-hero-side,
          .home-surface-panel,
          .home-final-cta {
            padding: 1rem;
          }

          .home-hero-copy h1 {
            font-size: 2.05rem;
          }

          .home-hero-actions,
          .home-final-actions {
            flex-direction: column;
          }

          .home-hero-actions a,
          .home-final-actions a {
            width: 100%;
          }

          .home-hero-stats,
          .home-faq-grid {
            grid-template-columns: 1fr;
          }

          .home-strip {
            padding: 0.9rem;
          }

          .home-product-card-media {
            min-height: 220px;
          }
        }
      `}</style>

      <StorefrontHeader
        showBlogLink
        actions={[
          { href: '/calorie-calculator', label: 'حاسبة السعرات', variant: 'muted' },
          { href: '/store', label: 'اكتشف البرامج', variant: 'primary' },
        ]}
      />

      <main className="home-main">
        <section className="home-hero">
          <article className="home-hero-main">
            <div className="home-hero-copy">
              <span className="storefront-pill">برامج رقمية للّياقة والتغذية والأداء</span>
              <h1>
                اختر <span className="home-hero-highlight">برنامجك المناسب</span>
                <br />
                وابدأ بخطتك من اليوم
              </h1>
              <p>
                في المعضل ستجد أنظمة غذائية مرنة، برامج تمارين، حلول علاجية،
                وباقات رقمية مرتبة لتسهّل عليك اختيار البرنامج المناسب لهدفك
                ومستواك، مع تجربة شراء عربية واضحة ووصول بعد الإتمام.
              </p>

              <div className="home-hero-actions">
                <Link href="/store" className="storefront-button-primary">
                  اكتشف البرامج
                </Link>
                <Link href="/calorie-calculator" className="storefront-button-secondary">
                  احسب سعراتك
                </Link>
                {freeOffer && (
                  <Link href="/store?free=true" className="storefront-button-secondary">
                    حمّل {freeOffer.title}
                  </Link>
                )}
              </div>

              <div className="home-hero-stats">
                <div className="home-hero-stat">
                  <strong>{productsCount}+</strong>
                  <span>منتج رقمي جاهز</span>
                </div>
                <div className="home-hero-stat">
                  <strong>{categories.length}</strong>
                  <span>أقسام رئيسية واضحة</span>
                </div>
                <div className="home-hero-stat">
                  <strong>{startingPrice > 0 ? `${startingPrice} ريال` : 'محتوى مجاني'}</strong>
                  <span>بداية سعرية واضحة</span>
                </div>
              </div>
            </div>
          </article>

          <aside className="home-hero-side">
            <div className="home-side-card">
              <span>عرض مجاني</span>
              <h3>{freeOffer ? freeOffer.title : 'ابدأ بخطوة أخف'}</h3>
              <p>
                {freeOffer
                  ? 'إذا أردت التعرف على أسلوب المتجر قبل الشراء، ابدأ أولًا بالمحتوى المجاني المتاح حاليًا.'
                  : 'ابدأ من أقسام المتجر لاختيار ما يناسب هدفك الحالي.'}
              </p>
            </div>

            <div className="home-side-card">
              <span>تغذية واضحة</span>
              <h3>
                {nutritionRange
                  ? `أنظمة مرنة من ${nutritionRange} سعرة`
                  : 'أنظمة غذائية محسوبة'}
              </h3>
              <p>
                خيارات سعرات مرتبة لمن يريد ضبط أكله اليومي بوضوح أكبر بدون
                الدخول في تعقيدات غير ضرورية.
              </p>
            </div>

            <div className="home-side-card">
              <span>خيارات متنوعة</span>
              <h3>تمارين، علاجية، وباقات</h3>
              <p>
                سواء كنت تبدأ من الصفر أو تبحث عن خيار يناسب وقتك أو تحتاج
                حلولًا للظهر والركبة، ستجد قسمًا واضحًا يقودك بسرعة.
              </p>
            </div>
          </aside>
        </section>

        <div className="home-strip">
          أنظمة غذائية مرنة • برامج للمبتدئين والمتوسطين • تمارين علاجية للظهر
          والركبة • باقات تغذية وتمارين وتأهيل • شراء سريع وواضح
        </div>

        <section className="home-section">
          <div className="home-surface-panel">
            <StorefrontSectionHeading
              eyebrow="الأقسام الرئيسية"
              title="تسوق حسب النوع الذي تحتاجه الآن"
              description="رتّبنا المتجر إلى فئات واضحة حتى تختصر وقت البحث وتنتقل مباشرة إلى ما يناسب هدفك الحالي."
            />

            <div className="home-category-grid">
              {categories.map(category => {
                const content = categoryContent[category.slug]

                if (!content) {
                  return null
                }

                return (
                  <Link key={category.id} href={content.href} className="home-category-card">
                    <div className={`home-category-icon ${content.imageUrl ? 'has-image' : ''}`}>
                      {content.imageUrl ? (
                        <Image
                          src={content.imageUrl}
                          alt={content.title}
                          width={64}
                          height={64}
                          className="home-category-icon-image"
                        />
                      ) : (
                        content.icon
                      )}
                    </div>
                    <h3>{category.name}</h3>
                    <p>{content.description}</p>
                    <div className="home-category-footer">
                      <span>{categoryCounts.get(category.slug) ?? 0} منتجات</span>
                      <span>استعرض القسم ←</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-surface-panel">
            <StorefrontSectionHeading
              eyebrow="ابدأ من هنا"
              title="منتجات مختارة من المتجر"
              description="اختيارات مناسبة للتعرّف على أبرز البرامج المتوفرة حاليًا داخل المتجر."
            />

            <div className="home-product-grid">
              {featuredProducts.map(product => (
                <HomeFeaturedProductCard
                  key={product.id}
                  href={`/store/${product.slug}`}
                  title={product.title}
                  description={
                    featuredDescriptions[product.slug] ||
                    product.description?.trim() ||
                      'برنامج رقمي جاهز يساعدك على البدء بما يناسب هدفك الحالي.'
                  }
                  categoryLabel={product.categories?.name ?? 'برنامج رقمي'}
                  priceLabel={product.is_free ? 'مجاني' : `${product.price} ريال`}
                  ctaLabel={product.is_free ? 'ابدأ اليوم' : 'عرض التفاصيل'}
                  badge={product.is_free ? '🎁' : '⚡'}
                  accentLabel={product.is_free ? 'مجاني' : 'رقمي'}
                  imageUrl={featuredProductImages.get(product.id) ?? null}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-surface-panel">
            <StorefrontSectionHeading
              eyebrow="حسب هدفك"
              title="ابدأ من المسار الأقرب لاحتياجك"
              description="إذا لم تكن متأكدًا من أين تبدأ، استخدم هذه المداخل السريعة للوصول إلى القسم أو البرنامج الأقرب لهدفك."
            />

            <div className="home-goal-grid">
              {goalCards.map(card => (
                <Link key={card.title} href={card.href} className="home-goal-card">
                  <span>{card.eyebrow}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <div className="home-goal-footer">
                    <span>{card.cta}</span>
                    <span>←</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-surface-panel">
            <StorefrontSectionHeading
              eyebrow="لماذا يختارون المعضل"
              title="من اختيار البرنامج حتى الوصول إليه"
              description="برامج واضحة، شراء منظم، ووصول مباشر يساعدك على البدء بثقة."
            />

            <div className="home-trust-grid">
              {trustItems.map(item => (
                <article key={item.title} className="home-trust-card">
                  <span>{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-surface-panel">
            <StorefrontSectionHeading
              eyebrow="أسئلة شائعة"
              title="إجابات سريعة قبل أن تبدأ"
              description="هذه أبرز النقاط التي يحتاج العميل معرفتها قبل اختيار البرنامج أو إتمام الطلب."
            />

            <div className="home-faq-grid">
              {faqItems.map(item => (
                <article key={item.question} className="home-faq-card">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-final-cta">
            <div>
              <span className="storefront-pill">جاهز تبدأ؟</span>
              <h2>اختر القسم المناسب وابدأ بخطوة واضحة</h2>
              <p>
                سواء كنت تبحث عن نظام غذائي مرن، برنامج تمرين، أو حل علاجي
                يناسب احتياجك، المتجر جاهز ليمنحك بداية واضحة من أول نقرة.
              </p>
            </div>

            <div className="home-final-actions">
              <Link href="/store" className="storefront-button-primary">
                تسوق الآن
              </Link>
              <Link
                href="/calorie-calculator"
                className="storefront-button-secondary"
              >
                احسب سعراتك
              </Link>
              {freeOffer && (
                <Link href="/store?free=true" className="storefront-button-secondary">
                  ابدأ بالمجاني
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <StorefrontFooter note="برامج رقمية في التغذية والتمارين والتأهيل والباقات في مكان واحد." />
    </div>
  )
}
