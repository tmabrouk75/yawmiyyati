// One-off: recompute DailyLog.streakGoalMet for existing history against each
// user's CURRENT streakGoals. Run this once after deploying the streak fix so
// past days stop reflecting the old configuration. Going forward the app keeps
// it current automatically (recomputeStreakGoal on every save, and
// recomputeStreakGoalRange whenever goals change in Settings).
//
// Logic mirrors lib/scoring/streakGoal.ts (the source of truth). If that file
// changes, update this one to match.
//
// Run (all users):       node prisma/recompute-streaks.js
// Run (one user only):   node prisma/recompute-streaks.js you@example.com

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const WINDOW_DAYS = 400
const FARDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function componentMet(key, { prayer, dhikr, quran }) {
  switch (key) {
    case 'fard':
      return FARDS.every(p => prayer?.[`${p}Done`] || prayer?.[`${p}IsQada`])
    case 'sunnah':
      return ['fajrBefore', 'dhuhrBefore', 'dhuhrAfter', 'maghribAfter', 'ishaAfter'].every(s => prayer?.[s])
    case 'zikr':
      return ['fajrAzkar', 'dhuhrAzkar', 'asrAzkar', 'maghribAzkar', 'ishaAzkar'].every(s => prayer?.[s])
    case 'mosque':
      return FARDS.every(p => prayer?.[`${p}Mosque`])
    case 'qiyam_witr':
      return (prayer?.qiyamRakaat ?? 0) > 0 && !!prayer?.witrDone
    case 'morning_evening_azkar':
      return !!dhikr?.morningAzkarDone && !!dhikr?.eveningAzkarDone
    case 'quran':
      return (quran?.pagesRead ?? 0) > 0
    default:
      return true
  }
}

function computeStreakGoalMet(goals, data) {
  const selected = goals && goals.length > 0 ? goals : ['fard']
  return selected.every(g => componentMet(g, data))
}

async function main() {
  const onlyEmail = process.argv[2] || null

  const users = await prisma.user.findMany({
    where: onlyEmail ? { email: onlyEmail } : undefined,
    select: { id: true, email: true, streakGoals: true },
  })
  if (users.length === 0) {
    console.log(onlyEmail ? `No user found for ${onlyEmail}` : 'No users found')
    return
  }

  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - WINDOW_DAYS)

  let totalFixed = 0
  for (const u of users) {
    const goals = (u.streakGoals && u.streakGoals.length) ? u.streakGoals : ['fard']
    const logs = await prisma.dailyLog.findMany({
      where: { userId: u.id, dateGregorian: { gte: since } },
      include: { prayerLog: true, dhikrLog: true, quranLog: true },
    })

    let fixed = 0
    for (const log of logs) {
      const met = computeStreakGoalMet(goals, {
        prayer: log.prayerLog, dhikr: log.dhikrLog, quran: log.quranLog,
      })
      if (met !== log.streakGoalMet) {
        await prisma.dailyLog.update({ where: { id: log.id }, data: { streakGoalMet: met } })
        fixed++
      }
    }
    totalFixed += fixed
    console.log(`${u.email}: goals=[${goals.join(', ')}]  ${fixed} day(s) updated of ${logs.length}`)
  }

  console.log(`\nDone. ${totalFixed} day(s) updated across ${users.length} user(s).`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); return prisma.$disconnect().finally(() => process.exit(1)) })
