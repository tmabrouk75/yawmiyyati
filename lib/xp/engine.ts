import { prisma } from '@/lib/db/prisma'
import { computeStreakGoalMet } from '@/lib/scoring/streakGoal'

// ─── XP RULES ────────────────────────────────────────────

// ─── SCORING RULES ───────────────────────────────────────
//
// Fard Salah:
//   Each of 5 Fard = 20 pts (total 100)
//   Prayed as Qadaa = 10 pts only (half)
//   If ANY Fard is fully missed (not even qadaa) → 0 pts for the whole day
//
// Sunnah rawatib: 4 pts each slot (Fajr before, Dhuhr before, Dhuhr after,
//                                   Maghrib after, Isha after) = max 20
// Post-prayer Azkar: 4 pts each × 5 = max 20
// Tasbih (33×3 done): 1 pt per 10 count, max 10
// Quran: 5 pts (any pages read)
// Fasting: 15 pts
// Sadaqah: 5 pts
// Morning Azkar: included in Dhikr box — 4 pts
// Evening Azkar: 4 pts
// Witr: 3 pts
// Duha: 3 pts
// Qiyam: 5 pts (any rakaat)
// Perfect day bonus: +25 (all fard done + at least 80% of active items)
// Streak bonuses:  7-day = +50,  30-day = +150

const SCORE = {
  // Per Fard prayer
  fard:              20,
  fard_qadaa:        10,  // half if prayed late as qadaa

  // Sunnah rawatib per slot
  sunnah_slot:        4,

  // Post-prayer azkar per prayer
  azkar_slot:         4,

  // Tasbih — 1 pt per 10 count, capped at 10
  tasbih_per_10:      1,
  tasbih_max:        10,

  // Quran
  quran_any:          5,

  // Fasting
  fasting:           15,

  // Sadaqah
  sadaqah:            5,

  // Morning / Evening Azkar
  morning_azkar:      4,
  evening_azkar:      4,

  // Other salah
  witr:               3,
  duha:               4,
  qiyam_any:         10,

  // Perfect day one-time bonus
  perfect_day:       25,

  // Daily streak bonuses (cumulative, reset on any missed perfect day)
  streak_perfect_daily: 25,   // day 2+   → +25/day
  streak_7_daily:       50,   // day 8+   → additional +50/day
  streak_30_daily:     100,   // day 31+  → additional +100/day
}

// ─── AWARD XP ─────────────────────────────────────────────

export async function awardXp(
  userId: string,
  reason: string,
  points: number,
  date: Date
) {
  await prisma.xpLog.create({
    data: {
      userId,
      points,
      reason,
      dateGregorian: date,
    },
  })
}

// ─── GET TOTAL XP ─────────────────────────────────────────

export async function getUserTotalXp(userId: string): Promise<number> {
  const result = await prisma.xpLog.aggregate({
    where: { userId },
    _sum: { points: true },
  })
  return result._sum.points ?? 0
}

// ─── GET LEVEL FROM XP ────────────────────────────────────

const LEVELS = [
  { level: 1,  nameEn: 'Mubtadi\'',  nameAr: 'مبتدئ',   xp: 0 },
  { level: 2,  nameEn: 'Talib',      nameAr: 'طالب',     xp: 500 },
  { level: 3,  nameEn: 'Musallin',   nameAr: 'مصلٍّ',    xp: 1500 },
  { level: 4,  nameEn: 'Qa\'im',     nameAr: 'قائم',     xp: 3500 },
  { level: 5,  nameEn: 'Dhakir',     nameAr: 'ذاكر',     xp: 7000 },
  { level: 6,  nameEn: 'Mujahid',    nameAr: 'مجاهد',    xp: 13000 },
  { level: 7,  nameEn: 'Wali',       nameAr: 'ولي',      xp: 22000 },
  { level: 8,  nameEn: 'Siddiq',     nameAr: 'صدّيق',    xp: 35000 },
  { level: 9,  nameEn: 'Rabbani',    nameAr: 'رباني',    xp: 55000 },
  { level: 10, nameEn: 'Abd Allah',  nameAr: 'عبد الله', xp: 80000 },
]

export function getLevelFromXp(totalXp: number) {
  let current = LEVELS[0]
  for (const level of LEVELS) {
    if (totalXp >= level.xp) current = level
    else break
  }
  const nextLevel = LEVELS.find(l => l.xp > totalXp)
  const progress = nextLevel
    ? ((totalXp - current.xp) / (nextLevel.xp - current.xp)) * 100
    : 100

  return { current, nextLevel, progress, totalXp }
}

// ─── CALCULATE PRAYER XP ──────────────────────────────────

export async function processPrayerXp(
  userId: string,
  prayerLog: any,
  date: Date
) {
  const xpItems: { reason: string; points: number }[] = []

  const FARDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

  // ── Rule: if ANY fard is fully missed (not done AND not qadaa) → 0 salah pts
  const anyMissed = FARDS.some(p => !prayerLog[`${p}Done`] && !prayerLog[`${p}IsQada`])
  if (anyMissed) {
    // Zero salah XP — still process sunnah/azkar if done
  } else {
    // Award fard points
    for (const p of FARDS) {
      const isQadaa = prayerLog[`${p}IsQada`]
      const pts     = isQadaa ? SCORE.fard_qadaa : SCORE.fard
      xpItems.push({ reason: `${p}_${isQadaa ? 'qadaa' : 'done'}`, points: pts })
    }
  }

  // ── Sunnah rawatib — 4 pts each slot (independent of fard miss rule)
  const sunnahSlots = [
    { key: 'fajrBefore',   label: 'sunnah_fajr_before'   },
    { key: 'dhuhrBefore',  label: 'sunnah_dhuhr_before'  },
    { key: 'dhuhrAfter',   label: 'sunnah_dhuhr_after'   },
    { key: 'maghribAfter', label: 'sunnah_maghrib_after'  },
    { key: 'ishaAfter',    label: 'sunnah_isha_after'     },
  ]
  for (const slot of sunnahSlots) {
    if (prayerLog[slot.key]) {
      xpItems.push({ reason: slot.label, points: SCORE.sunnah_slot })
    }
  }

  // ── Post-prayer azkar — 4 pts each prayer
  const azkarSlots = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  for (const p of azkarSlots) {
    if (prayerLog[`${p}Azkar`]) {
      xpItems.push({ reason: `${p}_azkar`, points: SCORE.azkar_slot })
    }
  }

  // ── Other salah
  if (prayerLog.duhaDone)       xpItems.push({ reason: 'duha',  points: SCORE.duha  })
  if (prayerLog.witrDone)       xpItems.push({ reason: 'witr',  points: SCORE.witr  })
  if (prayerLog.qiyamRakaat > 0) xpItems.push({ reason: 'qiyam', points: SCORE.qiyam_any })

  for (const item of xpItems) {
    await awardXp(userId, item.reason, item.points, date)
  }

  return xpItems.reduce((sum, i) => sum + i.points, 0)
}

// ─── CALCULATE DHIKR XP ───────────────────────────────────

export async function processDhikrXp(
  userId: string,
  dhikrLog: any,
  date: Date
) {
  const xpItems: { reason: string; points: number }[] = []

  if (dhikrLog.morningAzkarDone) xpItems.push({ reason: 'morning_azkar', points: SCORE.morning_azkar })
  if (dhikrLog.eveningAzkarDone) xpItems.push({ reason: 'evening_azkar', points: SCORE.evening_azkar })

  // Tasbih: 1 pt per 10, max 10
  if (dhikrLog.tasbihCount > 0) {
    const pts = Math.min(SCORE.tasbih_max, Math.floor(dhikrLog.tasbihCount / 10) * SCORE.tasbih_per_10)
    if (pts > 0) xpItems.push({ reason: 'tasbih', points: pts })
  }

  for (const item of xpItems) {
    await awardXp(userId, item.reason, item.points, date)
  }

  return xpItems.reduce((sum, i) => sum + i.points, 0)
}

// ─── CALCULATE QURAN XP ───────────────────────────────────

export async function processQuranXp(
  userId: string,
  quranLog: any,
  date: Date
) {
  let total = 0
  // Flat 5 pts for any Quran reading
  if (quranLog.pagesRead > 0) {
    await awardXp(userId, 'quran_any', SCORE.quran_any, date)
    total += SCORE.quran_any
  }
  return total
}

// ─── CALCULATE FASTING XP ─────────────────────────────────

export async function processFastingXp(
  userId: string,
  fastingLog: any,
  date: Date
) {
  if (!fastingLog.isFasting) return 0
  await awardXp(userId, 'fasting', SCORE.fasting, date)
  return SCORE.fasting
}

// ─── CALCULATE SADAQAH XP ─────────────────────────────────

export async function processSadaqahXp(
  userId: string,
  sadaqahLog: any,
  date: Date
) {
  if (!sadaqahLog.gave) return 0
  await awardXp(userId, 'sadaqah', SCORE.sadaqah, date)
  return SCORE.sadaqah
}

// ─── RECOMPUTE STREAK GOAL ────────────────────────────────
// Recomputes the per-day "streak goal met" flag from the user's configured
// streakGoals and the day's logs, then stores it. Called on every relevant
// save. Past days are never touched unless that day is itself re-saved, so
// changing the goal only affects days from here forward.
export async function recomputeStreakGoal(userId: string, date: Date) {
  const dailyLog = await prisma.dailyLog.findUnique({
    where: { userId_dateGregorian: { userId, dateGregorian: date } },
    include: { prayerLog: true, dhikrLog: true, quranLog: true },
  })
  if (!dailyLog) return
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { streakGoals: true } })
  const met = computeStreakGoalMet(u?.streakGoals ?? ['fard'], {
    prayer: dailyLog.prayerLog, dhikr: dailyLog.dhikrLog, quran: dailyLog.quranLog,
  })
  await prisma.dailyLog.update({ where: { id: dailyLog.id }, data: { streakGoalMet: met } })
}

// ─── DAILY STREAK BONUS ───────────────────────────────────
//
// Streak counts days where the user's configured streak goal was met
// (DailyLog.streakGoalMet), or period days. The goal is set in Settings.
//
// Bonuses stack daily and reset to 0 the moment any streak day is missed:
//   Day 2+:  +25 / day
//   Day 8+:  +25 + 50 = +75 / day
//   Day 31+: +25 + 50 + 100 = +175 / day

export async function checkAndAwardStreaks(userId: string, date: Date) {
  // Use streakGoalMet, set by recomputeStreakGoal on each relevant save.
  // Period days (isPeriod = true) count as streak-valid even without the goal.
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { dateGregorian: 'desc' },
    take: 60,
    select: { streakGoalMet: true, isPeriod: true, dateGregorian: true },
  })

  // Count consecutive days where streakGoalMet = true OR isPeriod = true
  let streak = 0
  for (const log of logs) {
    if (log.streakGoalMet || log.isPeriod) streak++
    else break
  }

  if (streak < 2) return 0

  let bonus = SCORE.streak_perfect_daily
  if (streak >= 8)  bonus += SCORE.streak_7_daily
  if (streak >= 31) bonus += SCORE.streak_30_daily

  // Idempotent — only award once per day
  const alreadyAwarded = await prisma.xpLog.findFirst({
    where: { userId, reason: 'daily_streak_bonus', dateGregorian: date },
  })
  if (!alreadyAwarded && bonus > 0) {
    await awardXp(userId, 'daily_streak_bonus', bonus, date)
  }

  return bonus
}

// ─── CHECK BADGES ─────────────────────────────────────────

export async function checkAndAwardBadges(userId: string) {
  const badges = await prisma.badgeDefinition.findMany()
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeDefinitionId: true },
  })
  const earned = new Set(userBadges.map(b => b.badgeDefinitionId))

  for (const badge of badges) {
    if (earned.has(badge.id)) continue

    let shouldAward = false

    switch (badge.triggerType) {
      case 'istighfar_total': {
        const sum = await prisma.dhikrLog.aggregate({
          where: { userId }, _sum: { istighfarCount: true },
        })
        if ((sum._sum.istighfarCount ?? 0) >= (badge.triggerValue ?? 0)) shouldAward = true
        break
      }
      case 'salawat_total': {
        const sum = await prisma.dhikrLog.aggregate({
          where: { userId }, _sum: { salawatCount: true },
        })
        if ((sum._sum.salawatCount ?? 0) >= (badge.triggerValue ?? 0)) shouldAward = true
        break
      }
      case 'quran_pages_total': {
        const sum = await prisma.quranLog.aggregate({
          where: { userId }, _sum: { pagesRead: true },
        })
        if ((sum._sum.pagesRead ?? 0) >= (badge.triggerValue ?? 0)) shouldAward = true
        break
      }
      case 'sadaqah_days': {
        const count = await prisma.sadaqahLog.count({
          where: { userId, gave: true },
        })
        if (count >= (badge.triggerValue ?? 0)) shouldAward = true
        break
      }
      case 'fard_streak': {
        // Count consecutive days where all 5 fard were done
        const prayerLogs = await prisma.prayerLog.findMany({
          where: { userId },
          orderBy: { dateGregorian: 'desc' },
          take: (badge.triggerValue ?? 7) + 5,
          select: { fajrDone: true, dhuhrDone: true, asrDone: true, maghribDone: true, ishaDone: true },
        })
        let fardStreak = 0
        for (const log of prayerLogs) {
          if (log.fajrDone && log.dhuhrDone && log.asrDone && log.maghribDone && log.ishaDone) fardStreak++
          else break
        }
        if (fardStreak >= (badge.triggerValue ?? 7)) shouldAward = true
        break
      }
      case 'quran_streak': {
        const quranLogs = await prisma.quranLog.findMany({
          where: { userId },
          orderBy: { dateGregorian: 'desc' },
          take: (badge.triggerValue ?? 7) + 5,
          select: { pagesRead: true },
        })
        let qStreak = 0
        for (const log of quranLogs) {
          if (log.pagesRead > 0) qStreak++
          else break
        }
        if (qStreak >= (badge.triggerValue ?? 7)) shouldAward = true
        break
      }
      case 'sadaqah_streak': {
        const sadaqahLogs = await prisma.sadaqahLog.findMany({
          where: { userId },
          orderBy: { dateGregorian: 'desc' },
          take: (badge.triggerValue ?? 7) + 5,
          select: { gave: true },
        })
        let sStreak = 0
        for (const log of sadaqahLogs) {
          if (log.gave) sStreak++
          else break
        }
        if (sStreak >= (badge.triggerValue ?? 7)) shouldAward = true
        break
      }
      case 'perfect_day': {
        const perfectCount = await prisma.dailyLog.count({
          where: { userId, completionPct: 100 },
        })
        if (perfectCount >= (badge.triggerValue ?? 1)) shouldAward = true
        break
      }
      case 'ramadan_complete': {
        const ramadanLogs = await prisma.fastingLog.count({
          where: { userId, fastingType: 'RAMADAN', isFasting: true },
        })
        if (ramadanLogs >= 27) shouldAward = true // 27+ days = completed Ramadan
        break
      }
      case 'qada_complete': {
        const qadaRecords = await prisma.qadaRecord.findMany({ where: { userId } })
        const allCleared = qadaRecords.length > 0 && qadaRecords.every(
          r => r.totalCompensated >= r.totalOwed && r.totalOwed > 0
        )
        if (allCleared) shouldAward = true
        break
      }
    }

    if (shouldAward) {
      await prisma.userBadge.create({
        data: { userId, badgeDefinitionId: badge.id },
      })
    }
  }
}
