// READ-ONLY. Dumps the azkar rows so we can see exactly what is incomplete.
// Changes nothing in the database.
//
// Run:  node --env-file=.env prisma/inspect-azkar.js
//
// For each (category, language) group it prints every row with the character
// length of each field (short lengths reveal truncation) and the full Arabic
// text, plus a coverage summary so AR vs EN gaps are obvious.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const len = s => (s == null ? 0 : [...s].length)  // count code points, not bytes
const pad = (n, w) => String(n).padStart(w)

async function main() {
  const rows = await prisma.azkarDefinition.findMany({
    orderBy: [{ category: 'asc' }, { language: 'asc' }, { sortOrder: 'asc' }],
  })

  const groups = {}
  for (const r of rows) {
    const k = `${r.category}/${r.language}`
    ;(groups[k] ||= []).push(r)
  }

  console.log('=== COUNT SUMMARY ===')
  for (const k of Object.keys(groups)) console.log(`${k}: ${groups[k].length} rows`)

  for (const k of Object.keys(groups)) {
    console.log(`\n=== ${k} (${groups[k].length} rows) ===`)
    for (const r of groups[k]) {
      console.log(
        `#${pad(r.sortOrder, 2)}  ar:${pad(len(r.textAr), 4)} tr:${pad(len(r.transliteration), 4)} en:${pad(len(r.translationEn), 4)} arT:${pad(len(r.translationAr), 4)}  x${r.repetitions}${r.isActive ? '' : ' [hidden]'}`
      )
      console.log(`     ${(r.textAr || '').replace(/\s+/g, ' ').trim()}`)
    }
  }

  console.log('\n=== FLAG: EN rows missing transliteration or translation ===')
  let flagged = 0
  for (const r of rows) {
    if (r.language === 'EN' && (len(r.transliteration) === 0 || len(r.translationEn) === 0)) {
      flagged++
      console.log(`${r.category}/EN #${r.sortOrder}: tr:${len(r.transliteration)} en:${len(r.translationEn)} | ${(r.textAr || '').slice(0, 50)}`)
    }
  }
  if (flagged === 0) console.log('(none)')
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); return prisma.$disconnect().finally(() => process.exit(1)) })
