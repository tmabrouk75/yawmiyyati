import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { processPrayerXp, checkAndAwardBadges, checkAndAwardStreaks, recomputeStreakGoal } from '@/lib/xp/engine'

// POST /api/activities/prayer
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { date, ...fields } = body

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_dateGregorian: { userId: user.id, dateGregorian: dateObj } },
    })
    if (!dailyLog) {
      return NextResponse.json({ error: 'Daily log not found. Load today first.' }, { status: 404 })
    }

    const prayerLog = await prisma.prayerLog.upsert({
      where:  { dailyLogId: dailyLog.id },
      create: { userId: user.id, dailyLogId: dailyLog.id, dateGregorian: dateObj, ...fields },
      update: fields,
    })

    // Delete old prayer XP for today then recalculate
    await prisma.xpLog.deleteMany({
      where: {
        userId: user.id,
        dateGregorian: dateObj,
        reason: {
          in: [
            'fajr_done', 'fajr_qadaa',
            'dhuhr_done', 'dhuhr_qadaa',
            'asr_done', 'asr_qadaa',
            'maghrib_done', 'maghrib_qadaa',
            'isha_done', 'isha_qadaa',
            'sunnah_fajr_before', 'sunnah_dhuhr_before', 'sunnah_dhuhr_after',
            'sunnah_maghrib_after', 'sunnah_isha_after',
            'fajr_azkar', 'dhuhr_azkar', 'asr_azkar', 'maghrib_azkar', 'isha_azkar',
            'duha', 'witr', 'qiyam',
            'daily_streak_bonus', 'perfect_day',
          ],
        },
      },
    })

    const xpEarned = await processPrayerXp(user.id, prayerLog, dateObj)
    await updateCompletionPct(user.id, dailyLog.id, dateObj, prayerLog)
    await recomputeStreakGoal(user.id, dateObj)
    await checkAndAwardStreaks(user.id, dateObj)
    await checkAndAwardBadges(user.id)

    return NextResponse.json({ prayerLog, xpEarned })
  } catch (error) {
    console.error('[PRAYER POST]', error)
    return NextResponse.json({ error: 'Failed to save prayer log' }, { status: 500 })
  }
}

// ─── HELPER — compute salahPerfect ────────────────────────
// salahPerfect = true when:
//   • All 5 Fard prayed (done OR qadaa counts)
//   • If sunnah_rawatib enabled → all applicable sunnah slots done
//   • If witr enabled           → witr done
//   • If qiyam enabled          → qiyam rakaat > 0
// Quran, Dhikr, Fasting, Sadaqah do NOT affect this flag

async function computeSalahPerfect(
  userId: string,
  p: any   // prayerLog
): Promise<boolean> {
  const enabled = await prisma.userActivity.findMany({
    where: { userId, isEnabled: true },
    include: { activityDefinition: true },
  })
  const keys = new Set(enabled.map(a => a.activityDefinition.key))

  // 1. All 5 Fard must be done or qadaa
  const allFard =
    (p?.fajrDone    || p?.fajrIsQada)    &&
    (p?.dhuhrDone   || p?.dhuhrIsQada)   &&
    (p?.asrDone     || p?.asrIsQada)     &&
    (p?.maghribDone || p?.maghribIsQada) &&
    (p?.ishaDone    || p?.ishaIsQada)
  if (!allFard) return false

  // 2. Sunnah rawatib (only if user has it enabled in settings)
  if (keys.has('sunnah_rawatib')) {
    const allSunnah =
      (p?.fajrBefore)    &&   // Fajr before
      (p?.dhuhrBefore)   &&   // Dhuhr before
      (p?.dhuhrAfter)    &&   // Dhuhr after
      (p?.maghribAfter)  &&   // Maghrib after
      (p?.ishaAfter)          // Isha after
    if (!allSunnah) return false
  }

  // 3. Witr (only if enabled)
  if (keys.has('witr') && !p?.witrDone) return false

  // 4. Qiyam (only if enabled)
  if (keys.has('qiyam') && !(p?.qiyamRakaat > 0)) return false

  return true
}

// ─── HELPER — update completion pct + salahPerfect ────────

async function updateCompletionPct(
  userId: string,
  dailyLogId: string,
  date: Date,
  prayerLog?: any
) {
  const [prayer, dhikr, quran, fasting, sadaqah] = await Promise.all([
    prayerLog ?? prisma.prayerLog.findUnique({ where: { dailyLogId } }),
    prisma.dhikrLog.findUnique({ where: { dailyLogId } }),
    prisma.quranLog.findUnique({ where: { dailyLogId } }),
    prisma.fastingLog.findUnique({ where: { dailyLogId } }),
    prisma.sadaqahLog.findUnique({ where: { dailyLogId } }),
  ])

  const userActivities = await prisma.userActivity.findMany({
    where: { userId, isEnabled: true },
    include: { activityDefinition: true },
  })

  let total = 0
  let done  = 0

  for (const ua of userActivities) {
    const key = ua.activityDefinition.key
    total++
    if      (key === 'fajr'            && (prayer?.fajrDone    || prayer?.fajrIsQada))    done++
    else if (key === 'dhuhr'           && (prayer?.dhuhrDone   || prayer?.dhuhrIsQada))   done++
    else if (key === 'asr'             && (prayer?.asrDone     || prayer?.asrIsQada))     done++
    else if (key === 'maghrib'         && (prayer?.maghribDone || prayer?.maghribIsQada)) done++
    else if (key === 'isha'            && (prayer?.ishaDone    || prayer?.ishaIsQada))    done++
    else if (key === 'sunnah_rawatib') {
      // Count individual slots: Fajr before, Dhuhr before, Dhuhr after, Maghrib after, Isha after
      const slots   = ['fajrBefore','dhuhrBefore','dhuhrAfter','maghribAfter','ishaAfter']
      const doneSlots = slots.filter(s => prayer?.[s]).length
      if (doneSlots === slots.length) done++
      else if (doneSlots > 0) {
        // Partial credit — count as fractional by adding partial items
        done += doneSlots / slots.length
        total-- // already counted above, re-adjust
        total += 1
      } else total-- // none done — don't penalise the whole day
    }
    else if (key === 'prayer_azkar') {
      const slots = ['fajrAzkar','dhuhrAzkar','asrAzkar','maghribAzkar','ishaAzkar']
      const doneSlots = slots.filter(s => prayer?.[s]).length
      if (doneSlots === slots.length) done++
      else if (doneSlots > 0) { done += doneSlots / slots.length; total-- ; total += 1 }
      else total--
    }
    else if (key === 'duha'            && prayer?.duhaDone)                               done++
    else if (key === 'witr'            && prayer?.witrDone)                               done++
    else if (key === 'qiyam'           && (prayer?.qiyamRakaat ?? 0) > 0)                 done++
    else if (key === 'morning_azkar'   && dhikr?.morningAzkarDone)                       done++
    else if (key === 'evening_azkar'   && dhikr?.eveningAzkarDone)                       done++
    else if (key === 'istighfar'       && (dhikr?.istighfarCount ?? 0) > 0)               done++
    else if (key === 'salawat'         && (dhikr?.salawatCount ?? 0) > 0)                 done++
    else if (key === 'quran_pages'     && (quran?.pagesRead ?? 0) > 0)                    done++
    else if (key === 'sadaqah'         && sadaqah?.gave)                                  done++
    else if (key === 'ramadan_fast'    && fasting?.isFasting)                             done++
    else if (key === 'monday_thursday' && fasting?.isFasting)                             done++
    else if (key === 'white_days'      && fasting?.isFasting)                             done++
    else if (key === 'eid_fitr'        && prayer?.eidFitrDone)                            done++
    else if (key === 'eid_adha'        && prayer?.eidAdhaDone)                            done++
    else if (key === 'jumuah'          && prayer?.jumuahDone)                             done++
    else if (key === 'taraweeh'        && prayer?.taraweehDone)                           done++
    else total--
  }

  const pct         = total > 0 ? Math.round((done / total) * 100) : 0
  const salahPerfect = await computeSalahPerfect(userId, prayer)

  await prisma.dailyLog.update({
    where: { id: dailyLogId },
    data: { completionPct: pct, salahPerfect },
  })

  return { pct, salahPerfect }
}

