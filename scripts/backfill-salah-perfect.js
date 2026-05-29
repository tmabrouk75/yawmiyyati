// Run once after deploying salahPerfect field:
// node scripts/backfill-salah-perfect.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Backfilling salahPerfect on historical daily logs...')

  const logs = await prisma.dailyLog.findMany({
    where: { salahPerfect: false },
    include: { prayerLog: true },
    take: 10000,
  })

  let updated = 0
  let skipped = 0

  for (const log of logs) {
    const p = log.prayerLog
    if (!p) { skipped++; continue }

    // Minimal check — all 5 fard done (or qadaa)
    const allFard =
      (p.fajrDone    || p.fajrIsQada)    &&
      (p.dhuhrDone   || p.dhuhrIsQada)   &&
      (p.asrDone     || p.asrIsQada)     &&
      (p.maghribDone || p.maghribIsQada) &&
      (p.ishaDone    || p.ishaIsQada)

    if (allFard) {
      await prisma.dailyLog.update({
        where: { id: log.id },
        data: { salahPerfect: true },
      })
      updated++
    } else {
      skipped++
    }
  }

  console.log(`✅ Done — updated: ${updated}, skipped (fard incomplete): ${skipped}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
