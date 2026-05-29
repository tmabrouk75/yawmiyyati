import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { toHijri, isFirstOfHijriMonth, HIJRI_MONTHS_EN, HIJRI_MONTHS_AR } from '@/lib/hijri'
import { buildReminderEmail } from '@/lib/email/templates'
import { sendEmail, buildUnsubscribeUrl } from '@/lib/email/send'

// GET /api/reminders/trigger
// Called by Vercel cron daily — sends reminders only on 1st of Hijri month
// Also callable manually with ?secret=CRON_SECRET for testing

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.nextUrl.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET ?? ''
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today     = new Date()
  const hijri     = toHijri(today)

  // ── Standard 1st-of-month reminder
  if (!isFirstOfHijriMonth(today)) {
    // Check if today is 13th Hijri (start of White Days 13–15)
    if (hijri.day === 13) {
      // Send White Days reminder to users who have it enabled
      const whiteDayUsers = await prisma.userActivity.findMany({
        where: {
          isEnabled: true,
          activityDefinition: { key: 'white_days' },
          user: { remindersEnabled: true, emailReminders: true },
        },
        include: { user: { select: { id: true, name: true, email: true, language: true } } },
      })

      for (const ua of whiteDayUsers) {
        const u = ua.user
        const isAr = u.language === 'AR'
        await sendEmail({
          to:      u.email,
          subject: isAr ? 'يومياتي — بدأت الأيام البيض' : 'Yawmiyyati — White Days start today',
          html: `<div style="font-family:sans-serif;padding:20px;max-width:480px;margin:0 auto;" dir="${isAr ? 'rtl' : 'ltr'}">
            <h2 style="color:#059669;">${isAr ? '🌕 الأيام البيض' : '🌕 White Days'}</h2>
            <p>${isAr
              ? `مرحباً ${u.name}، اليوم هو ١٣ ${HIJRI_MONTHS_AR[hijri.month]} — بداية الأيام البيض (١٣ و١٤ و١٥). لا تفوّت صيامها!`
              : `Hello ${u.name}, today is the 13th of ${HIJRI_MONTHS_EN[hijri.month]} — the White Days begin (13th, 14th, 15th). Don't miss the fast!`}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/today" style="display:inline-block;background:#059669;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;margin-top:12px;">
              ${isAr ? 'فتح التطبيق' : 'Open App'}
            </a>
          </div>`,
          text: isAr ? `الأيام البيض بدأت — ${u.name}` : `White Days begin today — ${u.name}`,
        }).catch(() => {})
      }
    }

    return NextResponse.json({
      skipped: true,
      reason: `Not first of Hijri month — day ${hijri.day}`,
      whiteDaysReminder: hijri.day === 13,
    })
  }

  const hijriMonthEn = HIJRI_MONTHS_EN[hijri.month]
  const hijriMonthAr = HIJRI_MONTHS_AR[hijri.month]
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL!

  console.log(`[REMINDERS] Sending for ${hijriMonthEn} ${hijri.year}`)

  // Get users with reminders enabled who haven't been sent this month
  const users = await prisma.user.findMany({
    where: { remindersEnabled: true },
    select: {
      id:            true,
      name:          true,
      email:         true,
      language:      true,
      emailReminders:true,
    },
  })

  let sent = 0; let skipped = 0; let failed = 0

  for (const user of users) {
    // Check already sent this Hijri month
    const alreadySent = await prisma.reminderLog.findFirst({
      where: { userId: user.id, hijriYear: hijri.year, hijriMonth: hijri.month },
    })
    if (alreadySent) { skipped++; continue }

    // Get Qada' remaining
    const qadaRecord = await prisma.qadaRecord.findFirst({
      where: { userId: user.id, ramadanYear: hijri.year },
    })
    const qadaRemaining = qadaRecord
      ? qadaRecord.totalOwed - qadaRecord.totalCompensated
      : 0

    // Get last streak (consecutive perfect days)
    const recentLogs = await prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { dateGregorian: 'desc' },
      take: 60,
      select: { completionPct: true },
    })
    let lastStreak = 0
    for (const log of recentLogs) {
      if (log.completionPct >= 100) lastStreak++
      else break
    }

    // ── In-app banner (always — stored as reminder log)
    await prisma.reminderLog.create({
      data: {
        userId:  user.id,
        hijriYear: hijri.year,
        hijriMonth: hijri.month,
        channel: 'in_app',
        messageSnippet: `${hijriMonthEn} ${hijri.year}`,
      },
    })

    // ── Email (if enabled)
    if (user.emailReminders) {
      const unsubscribeUrl = buildUnsubscribeUrl(user.id)
      const { subject, html, text } = buildReminderEmail({
        userName:       user.name,
        language:       user.language as 'EN' | 'AR',
        hijriMonth:     user.language === 'AR' ? hijriMonthAr : hijriMonthEn,
        hijriYear:      hijri.year,
        qadaRemaining,
        lastStreak,
        appUrl,
        unsubscribeUrl,
      })

      const result = await sendEmail({ to: user.email, subject, html, text })

      if (result.success) {
        await prisma.reminderLog.create({
          data: {
            userId:    user.id,
            hijriYear: hijri.year,
            hijriMonth: hijri.month,
            channel:   'email',
          },
        })
        sent++
      } else {
        failed++
      }
    } else {
      sent++ // in-app counted
    }
  }

  console.log(`[REMINDERS] Done — sent:${sent} skipped:${skipped} failed:${failed}`)
  return NextResponse.json({ sent, skipped, failed, hijriMonth: hijriMonthEn, hijriYear: hijri.year })
}
