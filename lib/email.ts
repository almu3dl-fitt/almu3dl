import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderEmail({
  to,
  customerName,
  orderId,
  items,
  total,
  downloadLinks,
}: {
  to: string
  customerName: string
  orderId: string
  items: { title: string; price: number }[]
  total: number
  downloadLinks: { title: string; url: string }[]
}) {
  const itemsHtml = items.map(item =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${item.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left;">${item.price === 0 ? 'مجاني' : item.price + ' ريال'}</td>
    </tr>`
  ).join('')

  const downloadsHtml = downloadLinks.map(link =>
    `<a href="${link.url}" style="display:block;background:#D4A843;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:bold;margin-bottom:8px;">
      ⬇️ حمّل: ${link.title}
    </a>`
  ).join('')

  await resend.emails.send({
   from: 'المعضل <orders@send.almu3dl.store>',
    to,
    subject: `تم الطلب بنجاح — المعضل #${orderId.slice(0, 8)}`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#B8912E;font-size:24px;margin:0;">المعضل — Almu3dl</h1>
        </div>

        <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="font-size:32px;margin:0 0 8px;">✅</p>
          <h2 style="margin:0 0 4px;color:#1a1a1a;">تم الطلب بنجاح!</h2>
          <p style="color:#777;margin:0;">شكراً لك ${customerName}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:10px 12px;text-align:right;font-size:14px;color:#555;">المنتج</th>
              <th style="padding:10px 12px;text-align:left;font-size:14px;color:#555;">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding:12px;font-weight:bold;text-align:right;">المجموع</td>
              <td style="padding:12px;font-weight:bold;text-align:left;color:#B8912E;">
                ${total === 0 ? 'مجاني' : total + ' ريال'}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-bottom:24px;">
          <h3 style="margin-bottom:12px;color:#1a1a1a;">📦 روابط التحميل</h3>
          ${downloadsHtml}
          <p style="font-size:12px;color:#999;margin-top:8px;">الروابط صالحة لمدة 7 أيام — 5 تحميلات كحد أقصى</p>
        </div>

        <div style="text-align:center;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:12px;">
          <p>رقم الطلب: ${orderId.slice(0, 8)}...</p>
          <p>© المعضل — Almu3dl</p>
        </div>
      </div>
    `,
  })
}