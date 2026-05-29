import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { generateReferralCode } from '@/lib/referral'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── GET /api/referral ────────────────────────────────────
// Returns the current user's referral code, stats, and referral list
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Auto-generate referral code if missing
  let referralCode = user.referralCode
  if (!referralCode) {
    let code = generateReferralCode()
    // Ensure uniqueness
    let existing = await prisma.user.findUnique({ where: { referralCode: code } })
    while (existing) {
      code = generateReferralCode()
      existing = await prisma.user.findUnique({ where: { referralCode: code } })
    }
    await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })
    referralCode = code
  }

  // Load referrals with referred user info
  const referrals = await prisma.referral.findMany({
    where:   { referrerId: user.id },
    include: {
      referred: { select: { name: true, email: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Load redemption history
  const redemptions = await prisma.pointRedemption.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take:    10,
  })

  const stats = {
    total:     referrals.length,
    sent:      referrals.filter(r => r.status === 'SENT').length,
    pending:   referrals.filter(r => r.status === 'PENDING').length,
    activated: referrals.filter(r => r.status === 'ACTIVATED').length,
  }

  return NextResponse.json({
    referralCode,
    referralPoints: user.referralPoints,
    stats,
    referrals,
    redemptions,
  })
}

// ─── POST /api/referral ───────────────────────────────────
// Send invite email → creates a SENT referral record
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // Make sure referral code exists
  let referralCode = user.referralCode
  if (!referralCode) {
    let code = generateReferralCode()
    let existing = await prisma.user.findUnique({ where: { referralCode: code } })
    while (existing) {
      code = generateReferralCode()
      existing = await prisma.user.findUnique({ where: { referralCode: code } })
    }
    await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })
    referralCode = code
  }

  // Don't invite existing users
  const alreadyUser = await prisma.user.findUnique({ where: { email } })
  if (alreadyUser) {
    return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
  }

  // Check if we already sent to this email
  const alreadySent = await prisma.referral.findFirst({
    where: { referrerId: user.id, sentToEmail: email },
  })
  if (alreadySent) {
    return NextResponse.json({ error: 'Invite already sent to this email.' }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yawmiyyati.com'
  const link   = `${appUrl}/register?ref=${referralCode}`

  // Send email
  await resend.emails.send({
    from:    `${process.env.EMAIL_FROM_NAME ?? 'Yawmiyyati'} <${process.env.EMAIL_FROM ?? 'noreply@yawmiyyati.com'}>`,
    to:      email,
    subject: `${user.name} invited you to Yawmiyyati — يومياتي`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0D1F2D;color:#fff;border-radius:16px;">
        <h1 style="color:#C9AA71;font-size:24px;margin-bottom:8px;">يومياتي · Yawmiyyati</h1>
        <p style="color:#fff;opacity:0.8;font-size:15px;line-height:1.6;margin-bottom:24px;">
          <strong>${user.name}</strong> invited you to join Yawmiyyati — your daily Islamic activity companion for prayers, Quran, and dhikr.
        </p>
        <a href="${link}" style="display:inline-block;background:#C9AA71;color:#0D1F2D;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Join Now — مجاناً
        </a>
        <p style="color:#fff;opacity:0.4;font-size:12px;margin-top:32px;">
          Or copy this link: ${link}
        </p>
      </div>
    `,
  })

  // Create SENT referral record
  await prisma.referral.create({
    data: {
      referrerId:  user.id,
      // referredId is required by schema — we use a placeholder until they sign up.
      // Workaround: store sentToEmail; referredId filled on actual signup.
      // We create a "ghost" record with referrerId = userId, referredId filled on signup.
      // Actually since referredId is @unique and we don't have the user yet,
      // we track sent invites separately via sentToEmail on a pending record.
      // On signup, we match by sentToEmail to upgrade the record.
      referredId:  `PENDING_${email}_${Date.now()}`, // placeholder, replaced on signup
      status:      'SENT',
      sentAt:      new Date(),
      sentToEmail: email,
    },
  })

  return NextResponse.json({ ok: true })
}
