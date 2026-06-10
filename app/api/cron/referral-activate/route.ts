import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { isAuthorizedCron } from '@/lib/auth/cron'

/**
 * GET|POST /api/cron/referral-activate
 *
 * Scans all PENDING referrals and activates any where the referred user
 * has daily logs on at least 3 different calendar days.
 *
 * Run daily via Vercel Cron (which sends GET with Authorization: Bearer).
 * Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Find all PENDING referrals (not yet activated)
  const pending = await prisma.referral.findMany({
    where: { status: 'PENDING' },
    select: {
      id:         true,
      referrerId: true,
      referredId: true,
    },
  })

  let activated = 0
  let skipped   = 0

  for (const ref of pending) {
    // Skip placeholder SENT records (referredId starts with "PENDING_")
    if (ref.referredId.startsWith('PENDING_')) {
      skipped++
      continue
    }

    // Count distinct calendar days the referred user has a daily log
    const logs = await prisma.dailyLog.findMany({
      where:  { userId: ref.referredId },
      select: { dateGregorian: true },
    })

    const distinctDays = new Set(
      logs.map(l => l.dateGregorian.toISOString().slice(0, 10)) // "YYYY-MM-DD"
    )

    if (distinctDays.size >= 3) {
      // Activate referral + credit 1 point to referrer
      await prisma.$transaction([
        prisma.referral.update({
          where: { id: ref.id },
          data:  { status: 'ACTIVATED', activatedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: ref.referrerId },
          data:  { referralPoints: { increment: 1 } },
        }),
 