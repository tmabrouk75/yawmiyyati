// Yawmiyyati — Email Templates
// All emails are bilingual: shown in user's language

interface ReminderData {
  userName:      string
  language:      'EN' | 'AR'
  hijriMonth:    string
  hijriYear:     number
  qadaRemaining: number
  lastStreak:    number
  appUrl:        string
  unsubscribeUrl:string
}

function hijriGreeting(month: string, lang: 'EN' | 'AR'): string {
  if (lang === 'AR') return `بداية شهر ${month} المبارك 🌙`
  return `A new Hijri month has begun — ${month} 🌙`
}

export function buildReminderEmail(data: ReminderData): { subject: string; html: string; text: string } {
  const isAr  = data.language === 'AR'
  const dir   = isAr ? 'rtl' : 'ltr'
  const align = isAr ? 'right' : 'left'

  const greeting    = hijriGreeting(data.hijriMonth, data.language)
  const hasQada     = data.qadaRemaining > 0
  const hasStreak   = data.lastStreak > 0

  const subject = isAr
    ? `يومياتي — بداية شهر ${data.hijriMonth} ${data.hijriYear}`
    : `Yawmiyyati — ${data.hijriMonth} ${data.hijriYear} has begun`

  const qadaLine = hasQada
    ? isAr
      ? `<p style="margin:0 0 12px;color:#dc2626;">لديك <strong>${data.qadaRemaining} أيام</strong> قضاء رمضان متبقية.</p>`
      : `<p style="margin:0 0 12px;color:#dc2626;">You have <strong>${data.qadaRemaining} Qada'</strong> days remaining.</p>`
    : ''

  const streakLine = hasStreak
    ? isAr
      ? `<p style="margin:0 0 12px;color:#374151;">آخر سلسلة لك كانت <strong>${data.lastStreak} يومًا</strong>. واصل!</p>`
      : `<p style="margin:0 0 12px;color:#374151;">Your last streak was <strong>${data.lastStreak} days</strong>. Keep it going!</p>`
    : ''

  const ctaLabel   = isAr ? 'افتح يومياتي' : 'Open Yawmiyyati'
  const unsubLabel = isAr ? 'إلغاء الاشتراك في التذكيرات' : 'Unsubscribe from reminders'

  const html = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0D1F2D;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;">🌙</p>
              <h1 style="margin:8px 0 0;color:#C9AA71;font-size:22px;font-weight:600;letter-spacing:0.02em;">
                يومياتي &nbsp;·&nbsp; Yawmiyyati
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;" dir="${dir}">
              <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;text-align:${align};">
                ${isAr ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;text-align:${align};">
                ${greeting}
              </p>
              ${qadaLine}
              ${streakLine}
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:${align};">
                ${isAr
                  ? 'تذكّر أن تسجّل عباداتك اليومية.'
                  : 'Remember to log your daily ibadah.'}
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.appUrl}/today"
                      style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;
                             padding:13px 32px;border-radius:12px;font-size:15px;font-weight:600;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                ${isAr ? 'هذه رسالة تذكير شهرية من يومياتي.' : 'This is your monthly reminder from Yawmiyyati.'}
              </p>
              <p style="margin:6px 0 0;font-size:11px;">
                <a href="${data.unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">
                  ${unsubLabel}
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = isAr
    ? `مرحباً ${data.userName}،\n\n${greeting}\n${hasQada ? `لديك ${data.qadaRemaining} أيام قضاء متبقية.\n` : ''}${hasStreak ? `آخر سلسلة لك كانت ${data.lastStreak} يومًا.\n` : ''}\nافتح التطبيق: ${data.appUrl}/today\n\nإلغاء الاشتراك: ${data.unsubscribeUrl}`
    : `Hello ${data.userName},\n\n${greeting}\n${hasQada ? `You have ${data.qadaRemaining} Qada' days remaining.\n` : ''}${hasStreak ? `Your last streak was ${data.lastStreak} days.\n` : ''}\nOpen the app: ${data.appUrl}/today\n\nUnsubscribe: ${data.unsubscribeUrl}`

  return { subject, html, text }
}
