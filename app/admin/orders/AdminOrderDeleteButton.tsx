'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type AdminOrderDeleteButtonProps = {
  orderId: string
  shortId: string
}

export default function AdminOrderDeleteButton({
  orderId,
  shortId,
}: AdminOrderDeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `هل تريد حذف الطلب ${shortId}؟ سيتم حذف العناصر والروابط المرتبطة به إذا كان الطلب معلقًا أو فاشلًا.`,
    )

    if (!confirmed) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        window.alert(data.error || 'تعذر حذف الطلب الآن.')
        return
      }

      router.refresh()
    } catch {
      window.alert('تعذر حذف الطلب الآن.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className="admin-button-danger"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? 'جاري الحذف...' : 'حذف الطلب'}
    </button>
  )
}
