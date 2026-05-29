import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email/send'

const SUPPORT_EMAIL = 't.mabrouk@outlook.com'
const SUPPORT_EMAIL_FROM = process.env.EMAIL_FROM!

// POST /api/support
// Body: { subject, message, category }
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { subject, message, category } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const categoryLabel = category ?? 'General'
    const emailSubject  = `[Yawmiyyati Support] ${categoryLabel}: ${subject?.trim() || 'No subject'}`

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;padding:24px;background:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
    <h2 style="color:#0D1F2D;margin:0 0 16px;">📩 New Support Request</h2>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:6px 0;color:#888;font-size:12px;width:100px;">From</td>
        <td style="padding:6px 0;font-size:13px;color:#111;">${user.name} &lt;${user.email}&gt;</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;font-size:12px;">Category</td>
        <td style="padding:6px 0;font-size:13px;color:#111;">${categoryLabel}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;font-size:12px;">Subject</td>
        <td style="padding:6px 0;font-size:13px;color:#111;">${subject?.trim() || '—'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;font-size:12px;">User ID</td>
        <td style="padding:6px 0;font-size:11px;color:#888;font-family:monospace;">${user.id}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;font-size:12px;">Premium</td>
        <td style="padding:6px 0;font-size:13px;color:#111;">${user.isPremium ? 'Yes ⭐' : 'Free'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;font-size:12px;">Language</td>
        <td style="padding:6px 0;font-size:13px;color:#111;">${user.language}</td>
      </tr>
    </table>

    <div style="background:#f9f9f9;border-radius:8px;padding:16px;border-left:3px solid #059669;">
      <p style="margin:0;font-size:14px;color:#111;white-space:pre-wrap;">${message.trim()}</p>
    </div>

    <p style="margin:20px 0 0;font-size:11px;color:#aaa;">
      Reply directly to this email to respond to ${user.name}.
    </p>
  </div>
</body>
</html>`

    const text = `Support Request from ${user.name} (${user.email})\nCategory: ${categoryLabel}\nSubject: ${subject ?? '—'}\n\n${message.trim()}`

    const result = await sendEmail({
      to:      SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      text,
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    // Send confirmation to user
    const confirmHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;padding:24px;background:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;text-align:center;">
    <div style="font-size:36px;margin-bottom:12px;">🤝</div>
    <h2 style="color:#0D1F2D;margin:0 0 8px;">
      ${user.language === 'AR' ? 'تم استلام رسالتك' : 'Message Received'}
    </h2>
    <p style="color:#666;font-size:14px;margin:0 0 20px;">
      ${user.language === 'AR'
        ? 'شكراً للتواصل معنا. سنرد عليك في أقرب وقت ممكن.'
        : 'Thank you for reaching out. We\'ll get back to you as soon as possible.'}
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/today"
       style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
      ${user.language === 'AR' ? 'العودة للتطبيق' : 'Back to App'}
    </a>
  </div>
</body>
</html>`

    await sendEmail({
      to:      user.email,
      subject: user.language === 'AR' ? 'يومياتي — تم استلام رسالتك' : 'Yawmiyyati — We received your message',
      html:    confirmHtml,
      text:    user.language === 'AR'
        ? 'شكراً للتواصل معنا. سنرد عليك قريباً.'
        : 'Thank you for reaching out. We\'ll get back to you soon.',
    }).catch(() => {}) // confirmation failing shouldn't block the response

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SUPPORT]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
