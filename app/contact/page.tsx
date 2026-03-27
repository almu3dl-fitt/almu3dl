import type { Metadata } from 'next'
import StorefrontContentPage from '@/app/components/StorefrontContentPage'
import { buildAbsoluteUrl, siteConfig } from '@/lib/site'

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description:
    'طرق التواصل مع متجر المعضل للاستفسارات العامة، متابعة الطلبات، والمشكلات المتعلقة بالوصول إلى المنتجات الرقمية.',
  alternates: {
    canonical: buildAbsoluteUrl('/contact'),
  },
}

export default function ContactPage() {
  return (
    <StorefrontContentPage
      eyebrow="تواصل معنا"
      title="إذا احتجت مساعدة فنحن هنا"
      description="إذا كان لديك استفسار عن طلبك، أو مشكلة في الوصول إلى الملفات، أو سؤال عام قبل الشراء، يمكنك التواصل معنا عبر القنوات الموضحة أدناه."
      headerActions={[
        { href: '/store', label: 'المتجر', variant: 'primary' },
        { href: '/faq', label: 'الأسئلة الشائعة', variant: 'muted' },
      ]}
      heroActions={[
        { href: `mailto:${siteConfig.supportEmail}`, label: 'راسلنا الآن', variant: 'primary', external: true },
        { href: '/faq', label: 'راجع الأسئلة الشائعة', variant: 'muted' },
      ]}
      cards={[
        {
          title: 'البريد الإلكتروني',
          description: siteConfig.supportEmail,
          href: `mailto:${siteConfig.supportEmail}`,
          linkLabel: 'فتح البريد',
          external: true,
        },
        {
          title: 'متابعة الطلبات',
          description:
            'عند المراسلة بخصوص طلب، أرسل رقم الطلب والبريد الإلكتروني المستخدم أثناء الشراء لتسريع المراجعة.',
        },
        {
          title: 'المدونة',
          description:
            'إذا كنت تبحث عن محتوى توضيحي أو مقالات تثقيفية قبل الشراء، يمكنك زيارة المدونة الخاصة بنا.',
          href: siteConfig.blogUrl,
          linkLabel: 'زيارة المدونة',
          external: true,
        },
        ...siteConfig.socialLinks.map(link => ({
          title: link.label,
          description: `تابع حساب ${link.label} للحصول على محتوى وتحديثات إضافية.`,
          href: link.href,
          linkLabel: `فتح ${link.label}`,
          external: true,
        })),
      ]}
      sections={[
        {
          title: 'متى يفضّل التواصل معنا؟',
          bullets: [
            'عند وجود مشكلة في الدفع أو الوصول إلى المنتج.',
            'عند الحاجة إلى توضيح قبل الشراء.',
            'عند وجود استفسار عن سياسة الاسترجاع أو الخصوصية.',
            'عند الرغبة في الإبلاغ عن رابط لا يعمل أو مشكلة تقنية.',
          ],
        },
        {
          title: 'ما الذي يسرّع الرد؟',
          bullets: [
            'ذكر رقم الطلب بوضوح.',
            'إرسال الرسالة من نفس البريد المستخدم في الشراء إن أمكن.',
            'شرح المشكلة بشكل مباشر ومختصر.',
            'إرفاق صورة للمشكلة أو رسالة الخطأ إذا كانت متاحة.',
          ],
        },
      ]}
      footerNote="صفحة التواصل مخصصة للاستفسارات العامة ومشكلات الطلبات والوصول إلى الملفات الرقمية."
    />
  )
}
