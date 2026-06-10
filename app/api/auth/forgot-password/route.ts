import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/send'
import { createHmac, randomBytes } from 'crypto'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit'

// POST /api/auth/forgot-password
// Body: { email }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Rate limit: 5 / hour per IP, 3 / hour per target email (stops mail flooding)
    const byIp    = rateLimit(`forgot:ip:${getClientIp(req)}`, 5, 60 * 60 * 1000)
    const byEmail = rateLimit(`forgot:email:${email.toLowerCase().trim()}`, 3, 60 * 60 * 1000)
    if (!byIp.ok)    return tooManyRequests(byIp.retryAfterSec, 'Too many requests. Try again later.')
    if (!byEmail.ok) return NextResponse.json({ success: true }) // silent, same as unknown email

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, language: true },
    })

    // Always return success — don't reveal if email exists (security)
    if (!user) return NextResponse.json({ success: true })

    // Generate a time-limited reset token (valid 1 hour)
    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken:     token,
        passwordResetExpiresAt: expiresAt,
      },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&uid=${user.id}`
    const isAr = user.language === 'AR'

    const html = `
<!DOCTYPE html><html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
    <div style="background:#0D1F2D;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <span style="color:#C9AA71;font-size:20px;font-weight:700;">🌙 يومياتي · Yawmiyyati</span>
    </div>
    <h2 style="color:#111;margin:0 0 12px;font-size:18px;">
      ${isAr ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}
    </h2>
    <p style="color:#555;font-size:14px;margin:0 0 20px;">
      ${isAr
        ? `مرحباً ${user.name}، اضغط الزر أدناه لإعادة تعيين كلمة مرورك. ينتهي الرابط خلال ساعة.`
        : `Hello ${user.name}, click below to reset your password. This link expires in 1 hour.`}
    </p>
    <a href="${resetUrl}" style="display:block;text-align:center;background:#059669;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:20px;">
      ${isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
    </a>
    <p style="color:#999;font-size:11px;text-align:center;">
      ${isAr
        ? 'إذا لم تطلب هذا، تجاهل هذه الرسالة.'
        : "If you didn't request this, ignore this email."}
    </p>
  </div>
</body></html>`

    await sendEmail({
      to:      user.email,
      subject: isAr ? 'يومياتي — إعادة تعيين كلمة المرور' : 'Yawmiyyati — Password Reset',
      html,
      text: `Reset your password: ${resetUrl}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FORGOT PASSWORD]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
