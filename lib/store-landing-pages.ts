export type StoreLandingSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

export type StoreLandingPageDefinition = {
  slug: string
  metadataTitle: string
  metadataDescription: string
  eyebrow: string
  title: string
  description: string
  productSlugs: string[]
  headerActions: Array<{
    href: string
    label: string
    variant?: 'default' | 'primary' | 'muted'
  }>
  heroActions: Array<{
    href: string
    label: string
    variant?: 'default' | 'primary' | 'muted'
  }>
  sections: StoreLandingSection[]
  footerNote: string
}

export const storeLandingPages: StoreLandingPageDefinition[] = [
  {
    slug: 'flexible-diet-plans',
    metadataTitle: 'أنظمة غذائية مرنة',
    metadataDescription:
      'صفحة مخصصة لأنظمة التغذية المرنة في متجر المعضل لمساعدتك على اختيار السعرات الأقرب لاحتياجك وهدفك.',
    eyebrow: 'دليل سريع',
    title: 'أنظمة غذائية مرنة تساعدك تبدأ من السعرات الأنسب لك',
    description:
      'إذا كان هدفك تنظيم الأكل اليومي بدون حرمان ولا تعقيد، فهذه الصفحة تجمع أقرب الخيارات المتاحة داخل المتجر مع نقطة بداية أوضح قبل الشراء.',
    productSlugs: ['flexible-diet-1300', 'flexible-diet-1500', 'flexible-diet-1800', 'nutrition-bundle'],
    headerActions: [
      { href: '/store?category=nutrition', label: 'كل الأنظمة الغذائية', variant: 'primary' },
      { href: '/calorie-calculator', label: 'حاسبة السعرات', variant: 'muted' },
    ],
    heroActions: [
      { href: '/calorie-calculator', label: 'احسب سعراتك أولًا', variant: 'primary' },
      { href: '/store?category=nutrition', label: 'تصفح الأنظمة', variant: 'muted' },
    ],
    sections: [
      {
        title: 'متى تناسبك هذه الصفحة؟',
        paragraphs: [
          'إذا كنت تريد بداية غذائية واضحة بدل الحيرة بين أرقام السعرات، فهذه الصفحة تختصر عليك الوصول إلى الخيارات الأقرب لهدفك الحالي.',
          'الفكرة هنا ليست اختيار أقل رقم أو أعلى رقم فقط، بل اختيار نقطة بداية منطقية يمكنك الالتزام بها فعليًا.',
        ],
      },
      {
        title: 'كيف تختار السعرات المناسبة؟',
        bullets: [
          'إذا كنت غير متأكد من احتياجك، ابدأ من حاسبة السعرات ثم عد إلى هذه الصفحة.',
          'إذا كان هدفك تنظيم الأكل بخطوة أسهل، ابدأ بخيار قريب من احتياجك بدل القفز إلى أرقام بعيدة.',
          'إذا أردت حزمة أشمل في التغذية، فالباقة قد تكون خيارًا أفضل من نظام منفرد.',
        ],
      },
    ],
    footerNote:
      'هذه الصفحة مخصصة لتسهيل اختيار الأنظمة الغذائية المرنة داخل المتجر قبل الانتقال إلى صفحة المنتج المناسبة.',
  },
  {
    slug: 'beginner-workout-programs',
    metadataTitle: 'برامج تمارين للمبتدئين',
    metadataDescription:
      'صفحة مخصصة لبرامج التمرين المناسبة للمبتدئين داخل متجر المعضل مع خيارات واضحة للبداية والاستمرار.',
    eyebrow: 'بداية أوضح',
    title: 'برامج تمارين للمبتدئين تساعدك تبدأ بخطة مفهومة',
    description:
      'إذا كنت تريد بداية مرتبة في التمرين بدل القفز بين المقاطع والبرامج، فهذه الصفحة تجمع الخيارات الأنسب للمبتدئين أو لمن يريد مسارًا عمليًا وواضحًا.',
    productSlugs: ['beginner-workout-4days', 'busy-program', 'toning-program', 'workout-bundle'],
    headerActions: [
      { href: '/store?category=workouts', label: 'كل برامج التمرين', variant: 'primary' },
      { href: '/contact', label: 'اسأل قبل الشراء', variant: 'muted' },
    ],
    heroActions: [
      { href: '/store?category=workouts&level=beginner', label: 'خيارات المبتدئين', variant: 'primary' },
      { href: '/#home-results', label: 'شاهد النتائج', variant: 'muted' },
    ],
    sections: [
      {
        title: 'لمن تناسب هذه البرامج؟',
        paragraphs: [
          'هذه الصفحة موجهة لمن يريد برنامجًا أوليًا واضحًا، أو لمن انقطع فترة طويلة ويريد العودة بطريقة أسهل وأكثر تنظيمًا.',
          'كما أنها مناسبة لمن لا يريد برنامجًا معقدًا من البداية ويبحث عن خطة يمكنه الاستمرار عليها فعليًا.',
        ],
      },
      {
        title: 'ما الفرق بين الخيارات هنا؟',
        bullets: [
          'بعض البرامج أنسب للبداية المباشرة للمبتدئ.',
          'بعضها موجه أكثر لمن وقته محدود ويحتاج حلًا عمليًا.',
          'إذا كنت تريد قيمة أكبر في مجموعة واحدة، قد تكون الباقة الرياضية خيارًا مناسبًا.',
        ],
      },
    ],
    footerNote:
      'هذه الصفحة تجمع الخيارات الأقرب للمبتدئين داخل المتجر حتى تختار برنامج التمرين الأنسب لك بسرعة أكبر.',
  },
  {
    slug: 'back-therapy-programs',
    metadataTitle: 'تمارين علاجية للظهر والركبة',
    metadataDescription:
      'صفحة مخصصة لتمارين الظهر والركبة وباقة التأهيل الرياضي داخل متجر المعضل لتسهيل الوصول إلى الحل العلاجي الأنسب.',
    eyebrow: 'تأهيل وحركة',
    title: 'تمارين علاجية للظهر والركبة مع خيارات تأهيل أوضح',
    description:
      'إذا كنت تبحث عن مسار علاجي أو تأهيلي أكثر ترتيبًا، فهذه الصفحة تجمع أبرز الخيارات المرتبطة بآلام الظهر والركبة وباقة التأهيل الرياضي في مكان واحد.',
    productSlugs: ['back-therapy', 'knee-therapy', 'rehab-bundle'],
    headerActions: [
      { href: '/store?category=therapy', label: 'كل الحلول العلاجية', variant: 'primary' },
      { href: '/contact', label: 'تواصل معنا', variant: 'muted' },
    ],
    heroActions: [
      { href: '/store?category=therapy', label: 'استعرض الخيارات العلاجية', variant: 'primary' },
      { href: '/contact', label: 'اسأل قبل الشراء', variant: 'muted' },
    ],
    sections: [
      {
        title: 'متى تبدأ من هنا؟',
        paragraphs: [
          'هذه الصفحة مناسبة لمن يريد الوصول مباشرة إلى الحلول العلاجية أو التأهيلية بدل التشتت بين بقية أقسام المتجر.',
          'كما أنها مفيدة لمن يريد مقارنة خيار منفرد مثل الظهر أو الركبة مقابل باقة أشمل للتأهيل.',
        ],
      },
      {
        title: 'كيف تختار بين الظهر والركبة والباقة؟',
        bullets: [
          'إذا كانت مشكلتك محددة بوضوح في الظهر أو الركبة فابدأ بالخيار الأقرب لها.',
          'إذا كنت تبحث عن حل أوسع أو تريد قيمة أكبر في مسار واحد، فالباقة العلاجية قد تكون الأنسب.',
          'إذا كنت غير متأكد، استخدم صفحة التواصل قبل الشراء لتقليل الحيرة واتخاذ قرار أفضل.',
        ],
      },
    ],
    footerNote:
      'هذه الصفحة تختصر عليك الوصول إلى الحلول العلاجية والتأهيلية داخل المتجر بحسب احتياجك الأقرب.',
  },
]

export function getStoreLandingPage(slug: string) {
  return storeLandingPages.find(page => page.slug === slug) ?? null
}
