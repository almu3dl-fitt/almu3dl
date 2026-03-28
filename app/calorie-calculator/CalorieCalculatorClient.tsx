'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type Goal = 'lose' | 'maintain' | 'gain'
type Gender = 'male' | 'female'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

type NutritionProduct = {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  calories: number
  imageUrl: string | null
}

type CalculatorResult = {
  bmr: number
  maintenanceCalories: number
  targetCalories: number
  recommendedProduct: NutritionProduct
  nearbyProducts: NutritionProduct[]
}

const activityConfig: Record<
  ActivityLevel,
  { label: string; factor: number; description: string }
> = {
  sedentary: {
    label: 'قليل الحركة',
    factor: 1.2,
    description: 'عمل مكتبي أو حركة يومية محدودة',
  },
  light: {
    label: 'نشاط خفيف',
    factor: 1.375,
    description: 'مشي أو تمرين خفيف من 1 إلى 3 أيام أسبوعيًا',
  },
  moderate: {
    label: 'نشاط متوسط',
    factor: 1.55,
    description: 'تمرين منتظم من 3 إلى 5 أيام أسبوعيًا',
  },
  active: {
    label: 'نشاط عالٍ',
    factor: 1.725,
    description: 'تمارين قوية أو مجهود بدني معظم أيام الأسبوع',
  },
  very_active: {
    label: 'نشاط عالٍ جدًا',
    factor: 1.9,
    description: 'تمارين مكثفة أو عمل بدني متكرر بشكل يومي',
  },
}

const goalConfig: Record<
  Goal,
  { label: string; adjustment: number; description: string }
> = {
  lose: {
    label: 'خسارة الوزن',
    adjustment: -400,
    description: 'خفض معتدل يساعدك تبدأ بخطوة واقعية أكثر',
  },
  maintain: {
    label: 'ثبات الوزن',
    adjustment: 0,
    description: 'للحفاظ على وزنك الحالي مع تنظيم أوضح للأكل',
  },
  gain: {
    label: 'زيادة الوزن',
    adjustment: 250,
    description: 'زيادة تدريجية لبداية أكثر توازنًا',
  },
}

function roundToNearest5(value: number) {
  return Math.round(value / 5) * 5
}

function clampMinimumCalories(gender: Gender, value: number) {
  const minimum = gender === 'female' ? 1200 : 1400
  return Math.max(minimum, value)
}

function getRecommendedProduct(
  products: NutritionProduct[],
  targetCalories: number,
  goal: Goal,
) {
  if (products.length === 0) {
    return null
  }

  const sorted = [...products].sort((a, b) => a.calories - b.calories)

  if (goal === 'lose') {
    const lowerOrEqual = sorted.filter(product => product.calories <= targetCalories)
    return lowerOrEqual[lowerOrEqual.length - 1] ?? sorted[0]
  }

  if (goal === 'gain') {
    const higherOrEqual = sorted.filter(product => product.calories >= targetCalories)
    return higherOrEqual[0] ?? sorted[sorted.length - 1]
  }

  return sorted.reduce((closest, current) => {
    const currentDiff = Math.abs(current.calories - targetCalories)
    const closestDiff = Math.abs(closest.calories - targetCalories)
    return currentDiff < closestDiff ? current : closest
  }, sorted[0])
}

export default function CalorieCalculatorClient({
  nutritionProducts,
}: {
  nutritionProducts: NutritionProduct[]
}) {
  const [form, setForm] = useState({
    gender: 'male' as Gender,
    age: '',
    weight: '',
    height: '',
    activityLevel: 'moderate' as ActivityLevel,
    goal: 'lose' as Goal,
  })
  const [error, setError] = useState('')
  const [result, setResult] = useState<CalculatorResult | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const age = Number(form.age)
    const weight = Number(form.weight)
    const height = Number(form.height)

    if (!age || !weight || !height) {
      setError('أدخل كل البيانات المطلوبة بشكل صحيح.')
      return
    }

    if (age < 15 || age > 80) {
      setError('أدخل عمرًا بين 15 و80 سنة للحصول على نتيجة تقديرية أقرب.')
      return
    }

    if (weight < 35 || weight > 250) {
      setError('أدخل وزنًا بالكيلوغرام ضمن نطاق منطقي.')
      return
    }

    if (height < 130 || height > 230) {
      setError('أدخل طولًا بالسنتيمتر ضمن نطاق منطقي.')
      return
    }

    const bmr =
      form.gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161

    const maintenanceCalories = roundToNearest5(
      bmr * activityConfig[form.activityLevel].factor,
    )
    const targetCalories = roundToNearest5(
      clampMinimumCalories(
        form.gender,
        maintenanceCalories + goalConfig[form.goal].adjustment,
      ),
    )

    const recommendedProduct = getRecommendedProduct(
      nutritionProducts,
      targetCalories,
      form.goal,
    )

    if (!recommendedProduct) {
      setError('تعذر العثور على نظام غذائي متاح حاليًا داخل المتجر.')
      setResult(null)
      return
    }

    const nearbyProducts = nutritionProducts
      .filter(product => product.id !== recommendedProduct.id)
      .sort(
        (a, b) =>
          Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories),
      )
      .slice(0, 2)

    setResult({
      bmr: roundToNearest5(bmr),
      maintenanceCalories,
      targetCalories,
      recommendedProduct,
      nearbyProducts,
    })
  }

  return (
    <div className="calorie-calculator-shell">
      <style>{`
        .calorie-calculator-shell {
          width: min(calc(100% - 2rem), var(--store-content-width));
          margin: 0 auto;
          padding: 1.4rem 0 0;
          font-family: var(--font-tajawal), 'Arial', sans-serif;
          direction: rtl;
        }

        .calculator-hero,
        .calculator-form-panel,
        .calculator-result-panel,
        .calculator-disclaimer {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--store-border);
          border-radius: var(--store-radius-xl);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            var(--store-surface);
          box-shadow: var(--store-shadow);
        }

        .calculator-hero::before,
        .calculator-form-panel::before,
        .calculator-result-panel::before {
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

        .calculator-hero {
          padding: 1.6rem;
          margin-bottom: 1rem;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.14), rgba(255, 255, 255, 0.02) 46%),
            var(--store-surface);
        }

        .calculator-hero-content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr);
          gap: 1rem;
          align-items: start;
        }

        .calculator-hero h1 {
          margin: 0 0 0.9rem;
          color: var(--store-text);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 900;
          line-height: 1.15;
        }

        .calculator-hero p {
          margin: 0;
          max-width: 720px;
          color: var(--store-text-muted);
          font-size: 0.97rem;
          line-height: 1.9;
        }

        .calculator-hero-copy {
          display: grid;
          gap: 0.95rem;
        }

        .calculator-trust-list {
          display: grid;
          gap: 0.7rem;
        }

        .calculator-trust-card {
          padding: 0.95rem;
          border: 1px solid var(--store-border);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
        }

        .calculator-trust-card strong {
          display: block;
          margin-bottom: 0;
          color: var(--store-text);
          font-size: 0.96rem;
          font-weight: 900;
          line-height: 1.65;
        }

        .calculator-layout {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          gap: 1rem;
          align-items: start;
        }

        .calculator-form-panel,
        .calculator-result-panel {
          padding: 1.25rem;
        }

        .calculator-form-head,
        .calculator-result-head {
          margin-bottom: 1rem;
        }

        .calculator-form-head h2,
        .calculator-result-head h2 {
          margin: 0 0 0.35rem;
          color: var(--store-text);
          font-size: 1.18rem;
          font-weight: 900;
        }

        .calculator-form-head p,
        .calculator-result-head p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.88rem;
          line-height: 1.8;
        }

        .calculator-form {
          display: grid;
          gap: 0.95rem;
        }

        .calculator-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .calculator-field {
          display: grid;
          gap: 0.45rem;
        }

        .calculator-field label {
          color: var(--store-text);
          font-size: 0.88rem;
          font-weight: 800;
        }

        .calculator-field small {
          color: var(--store-text-soft);
          font-size: 0.74rem;
          line-height: 1.65;
        }

        .calculator-select,
        .calculator-input {
          width: 100%;
          min-height: 50px;
          padding: 0.88rem 0.95rem;
          border: 1px solid var(--store-border);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          color: var(--store-text);
          font-size: 0.95rem;
          font-family: var(--font-tajawal), Arial, sans-serif;
          outline: none;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background-color 0.18s ease;
        }

        .calculator-select:focus,
        .calculator-input:focus {
          border-color: var(--store-border-strong);
          box-shadow: 0 0 0 4px rgba(224, 180, 72, 0.14);
          background: rgba(255, 255, 255, 0.05);
        }

        .calculator-error {
          padding: 0.8rem 0.95rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 107, 107, 0.34);
          background: rgba(255, 107, 107, 0.12);
          color: #ff9a9a;
          font-size: 0.84rem;
          font-weight: 700;
          line-height: 1.8;
        }

        .calculator-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .calculator-summary-card {
          padding: 0.95rem 0.9rem;
          border: 1px solid var(--store-border);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
        }

        .calculator-summary-card span {
          display: block;
          margin-bottom: 0.32rem;
          color: var(--store-text-soft);
          font-size: 0.74rem;
          font-weight: 700;
        }

        .calculator-summary-card strong {
          color: var(--store-accent-strong);
          font-size: 1.3rem;
          font-weight: 900;
        }

        .calculator-result-note {
          margin: 0 0 1rem;
          color: var(--store-text-muted);
          font-size: 0.88rem;
          line-height: 1.8;
        }

        .calculator-product-card {
          display: grid;
          grid-template-columns: minmax(0, 170px) minmax(0, 1fr);
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--store-border);
          border-radius: 22px;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.1), rgba(255, 255, 255, 0.02) 48%),
            rgba(255, 255, 255, 0.03);
        }

        .calculator-product-media {
          position: relative;
          min-height: 190px;
          overflow: hidden;
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(224, 180, 72, 0.16), rgba(15, 17, 15, 0.18)),
            #0d0f0d;
        }

        .calculator-product-media::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.46)),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 22px,
              rgba(255, 255, 255, 0.05) 22px,
              rgba(255, 255, 255, 0.05) 23px
            );
          pointer-events: none;
        }

        .calculator-product-image {
          object-fit: cover;
        }

        .calculator-product-fallback {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: var(--store-accent-strong);
          font-size: 2.6rem;
          z-index: 1;
        }

        .calculator-product-copy {
          display: grid;
          gap: 0.75rem;
          align-content: start;
        }

        .calculator-product-badge-row {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .calculator-product-badge {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0.25rem 0.68rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--store-text-soft);
          font-size: 0.74rem;
          font-weight: 800;
        }

        .calculator-product-badge.is-accent {
          background: var(--store-accent-wash);
          color: var(--store-accent-strong);
        }

        .calculator-product-copy h3 {
          margin: 0;
          color: var(--store-text);
          font-size: 1.2rem;
          font-weight: 900;
          line-height: 1.45;
        }

        .calculator-product-copy p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.87rem;
          line-height: 1.85;
        }

        .calculator-nearby {
          margin-top: 1rem;
          display: grid;
          gap: 0.7rem;
        }

        .calculator-nearby h3 {
          margin: 0;
          color: var(--store-text);
          font-size: 0.98rem;
          font-weight: 900;
        }

        .calculator-nearby-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .calculator-nearby-card {
          padding: 0.9rem;
          border: 1px solid var(--store-border);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          text-decoration: none;
        }

        .calculator-nearby-card strong {
          display: block;
          margin-bottom: 0.35rem;
          color: var(--store-text);
          font-size: 0.9rem;
          font-weight: 800;
          line-height: 1.6;
        }

        .calculator-nearby-card span {
          color: var(--store-text-muted);
          font-size: 0.8rem;
        }

        .calculator-disclaimer {
          margin-top: 1rem;
          padding: 1rem 1.1rem;
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(224, 180, 72, 0.08), rgba(255, 255, 255, 0.015)),
            rgba(255, 255, 255, 0.02);
        }

        .calculator-disclaimer p {
          margin: 0;
          color: var(--store-text-muted);
          font-size: 0.83rem;
          line-height: 1.85;
        }

        @media (max-width: 960px) {
          .calculator-hero-content,
          .calculator-layout,
          .calculator-product-card,
          .calculator-nearby-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .calorie-calculator-shell {
            width: min(calc(100% - 1rem), var(--store-content-width));
            padding-top: 1rem;
          }

          .calculator-hero,
          .calculator-form-panel,
          .calculator-result-panel,
          .calculator-disclaimer {
            padding: 1rem;
          }

          .calculator-form-grid,
          .calculator-summary-grid {
            grid-template-columns: 1fr;
          }

          .calculator-product-media {
            min-height: 220px;
          }
        }
      `}</style>

      <section className="calculator-hero">
        <div className="calculator-hero-content">
          <div className="calculator-hero-copy">
            <span className="storefront-pill">حاسبة السعرات الحرارية</span>
            <h1>احسب احتياجك اليومي واختر النظام الأقرب لك</h1>
            <p>
              أدخل بياناتك الأساسية للحصول على تقدير يومي للسعرات، ثم سنرشّح لك
              أقرب نظام غذائي متاح حاليًا في المتجر لتبدأ رحلة خسارة أو زيادة
              الوزن بخطوة أوضح وأكثر تنظيمًا.
            </p>
          </div>

          <div className="calculator-trust-list">
            <div className="calculator-trust-card">
              <strong>نتيجة تقديرية واضحة</strong>
            </div>
            <div className="calculator-trust-card">
              <strong>ترشيح من منتجات المتجر الفعلية</strong>
            </div>
            <div className="calculator-trust-card">
              <strong>بداية عملية بدون تعقيد</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="calculator-layout">
        <section className="calculator-form-panel">
          <div className="calculator-form-head">
            <h2>أدخل بياناتك</h2>
            <p>
              كلما كانت البيانات أقرب لوضعك الحالي، كانت النتيجة التقديرية أقرب
              كخطوة أولى.
            </p>
          </div>

          <form className="calculator-form" onSubmit={handleSubmit}>
            <div className="calculator-form-grid">
              <div className="calculator-field">
                <label htmlFor="gender">الجنس</label>
                <select
                  id="gender"
                  className="calculator-select"
                  value={form.gender}
                  onChange={event =>
                    setForm(current => ({ ...current, gender: event.target.value as Gender }))
                  }
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              <div className="calculator-field">
                <label htmlFor="goal">الهدف</label>
                <select
                  id="goal"
                  className="calculator-select"
                  value={form.goal}
                  onChange={event =>
                    setForm(current => ({ ...current, goal: event.target.value as Goal }))
                  }
                >
                  {Object.entries(goalConfig).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="calculator-field">
                <label htmlFor="age">العمر</label>
                <input
                  id="age"
                  className="calculator-input"
                  type="number"
                  min="15"
                  max="80"
                  placeholder="مثال: 28"
                  value={form.age}
                  onChange={event => setForm(current => ({ ...current, age: event.target.value }))}
                />
              </div>

              <div className="calculator-field">
                <label htmlFor="weight">الوزن بالكيلوغرام</label>
                <input
                  id="weight"
                  className="calculator-input"
                  type="number"
                  min="35"
                  max="250"
                  step="0.1"
                  placeholder="مثال: 78"
                  value={form.weight}
                  onChange={event =>
                    setForm(current => ({ ...current, weight: event.target.value }))
                  }
                />
              </div>

              <div className="calculator-field">
                <label htmlFor="height">الطول بالسنتيمتر</label>
                <input
                  id="height"
                  className="calculator-input"
                  type="number"
                  min="130"
                  max="230"
                  placeholder="مثال: 175"
                  value={form.height}
                  onChange={event =>
                    setForm(current => ({ ...current, height: event.target.value }))
                  }
                />
              </div>

              <div className="calculator-field">
                <label htmlFor="activity">مستوى النشاط</label>
                <select
                  id="activity"
                  className="calculator-select"
                  value={form.activityLevel}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      activityLevel: event.target.value as ActivityLevel,
                    }))
                  }
                >
                  {Object.entries(activityConfig).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <small>{activityConfig[form.activityLevel].description}</small>
              </div>
            </div>

            {error && <div className="calculator-error">{error}</div>}

            <button type="submit" className="storefront-button-primary" style={{ width: '100%' }}>
              احسب السعرات الآن
            </button>
          </form>
        </section>

        <section className="calculator-result-panel">
          <div className="calculator-result-head">
            <h2>النتيجة المقترحة</h2>
            <p>
              ستظهر هنا السعرات التقديرية والنظام الغذائي الأقرب من منتجات
              المتجر لتبدأ منه.
            </p>
          </div>

          {!result ? (
            <div className="storefront-empty-state">
              أدخل بياناتك ثم اضغط على زر الحساب لعرض السعرات التقديرية والنظام
              الغذائي الأقرب لك.
            </div>
          ) : (
            <>
              <div className="calculator-summary-grid">
                <div className="calculator-summary-card">
                  <span>معدل الأيض الأساسي</span>
                  <strong>{result.bmr}</strong>
                </div>
                <div className="calculator-summary-card">
                  <span>احتياجك للمحافظة</span>
                  <strong>{result.maintenanceCalories}</strong>
                </div>
                <div className="calculator-summary-card">
                  <span>السعرات المقترحة لهدفك</span>
                  <strong>{result.targetCalories}</strong>
                </div>
              </div>

              <p className="calculator-result-note">
                هدفك الحالي هو <strong>{goalConfig[form.goal].label}</strong>، لذلك
                اقترحنا سعرات يومية تقريبية قدرها{' '}
                <strong>{result.targetCalories} سعرة</strong>. النظام التالي هو
                الأقرب من الخيارات المتاحة حاليًا في المتجر للبدء بخطوة أوضح.
              </p>

              <article className="calculator-product-card">
                <div className="calculator-product-media">
                  {result.recommendedProduct.imageUrl ? (
                    <Image
                      src={result.recommendedProduct.imageUrl}
                      alt={result.recommendedProduct.title}
                      fill
                      sizes="(max-width: 960px) 100vw, 240px"
                      className="calculator-product-image"
                    />
                  ) : (
                    <span className="calculator-product-fallback">CAL</span>
                  )}
                </div>

                <div className="calculator-product-copy">
                  <div className="calculator-product-badge-row">
                    <span className="calculator-product-badge is-accent">
                      {result.recommendedProduct.calories} سعرة
                    </span>
                    <span className="calculator-product-badge">
                      {result.recommendedProduct.price} ريال
                    </span>
                    <span className="calculator-product-badge">
                      أقرب خيار متاح الآن
                    </span>
                  </div>

                  <h3>{result.recommendedProduct.title}</h3>
                  <p>
                    {result.recommendedProduct.description?.trim() ||
                      `هذا النظام هو الأقرب حاليًا لاحتياجك التقديري البالغ ${result.targetCalories} سعرة يوميًا، ويمكن أن يكون نقطة بداية مناسبة لتنظيم الأكل بشكل أوضح.`}
                  </p>

                  <div className="calculator-product-badge-row">
                    <span className="calculator-product-badge">
                      {goalConfig[form.goal].description}
                    </span>
                    <span className="calculator-product-badge">
                      {activityConfig[form.activityLevel].label}
                    </span>
                  </div>

                  <Link
                    href={`/store/${result.recommendedProduct.slug}`}
                    className="storefront-button-primary"
                    style={{ width: '100%' }}
                  >
                    ابدأ بهذا النظام
                  </Link>
                </div>
              </article>

              {result.nearbyProducts.length > 0 && (
                <div className="calculator-nearby">
                  <h3>خيارات قريبة أيضًا</h3>
                  <div className="calculator-nearby-grid">
                    {result.nearbyProducts.map(product => (
                      <Link
                        key={product.id}
                        href={`/store/${product.slug}`}
                        className="calculator-nearby-card"
                      >
                        <strong>{product.title}</strong>
                        <span>
                          {product.calories} سعرة • {product.price} ريال
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="calculator-disclaimer">
        <p>
          هذه الحاسبة تعطي تقديرًا عامًا مبنيًا على بياناتك المدخلة، ولا تُعد
          تشخيصًا طبيًا أو بديلًا عن استشارة مختص عند وجود حالات صحية خاصة أو
          احتياجات غذائية علاجية فردية.
        </p>
      </section>
    </div>
  )
}
