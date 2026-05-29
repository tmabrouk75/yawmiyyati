import { Resend } from 'resend'
import { createHmac } from 'crypto'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || 'missing')
  return _resend
}

export interface SendEmailParams {
  to:      string
  subject: string
  html:    string
  text:    string
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; id?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from:    `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to:      params.to,
      subject: params.subject,
      html:    params.html,
      text:    params.text,
    })

    if (error) {
      console.error('[EMAIL SEND ERROR]', error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('[EMAIL SEND EXCEPTION]', error)
    return { success: false }
  }
}

// ─── UNSUBSCRIBE TOKEN ────────────────────────────────────
// HMAC-based token so users can unsubscribe without being logged in

export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.JWT_SECRET!
  return createHmac('sha256', secret).update(userId).digest('hex').slice(0, 32)
}

export function buildUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId)
  return `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?uid=${userId}&token=${token}`
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId)
  return token === expected
}
