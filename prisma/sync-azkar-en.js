// Rebuild the English (language = 'EN') Morning and Evening azkar sets from the
// complete content in azkar-en-library.js, so English users get the full
// collection with transliteration and translation, matching the Arabic set.
//
// SCOPE: touches ONLY language = 'EN', category MORNING and EVENING. It does
// NOT touch the Arabic set, After-Salah, CUSTOM, or any user's own azkar.
// UserAzkar rows keep their own text and only hold an optional link that is set
// to null on delete, so user data is preserved.
//
// Each category is rebuilt inside a transaction (delete then insert), so if
// anything fails the whole category rolls back and nothing is lost.
//
// REVIEW the content in azkar-en-library.js before running in production.
//
// Run:  node --env-file=.env prisma/sync-azkar-en.js
// Then: node --env-file=.env prisma/inspect-azkar.js   (to verify)

const { PrismaClient } = require('@prisma/client')
const { LIBRARY } = require('./azkar-en-library')
const prisma = new PrismaClient()

async function main() {
  for (const [category, items] of Object.entries(LIBRARY)) {
    const before = await prisma.azkarDefinition.count({ where: { category, language: 'EN' } })
    await prisma.$transaction(async (tx) => {
      await tx.azkarDefinition.deleteMany({ where: { category, language: 'EN' } })
      let sortOrder = 0
      for (const it of items) {
        await tx.azkarDefinition.create({
          data: {
            category,
            language:        'EN',
            textAr:          it.ar,
            transliteration: it.tr,
            translationEn:   it.en,
            translationAr:   null,
            repetitions:     it.reps ?? 1,
            sortOrder:       sortOrder++,
            isActive:        true,
          },
        })
      }
    })
    console.log(`EN ${category}: ${before} -> ${items.length} rows`)
  }
  console.log('Done. Arabic set, After-Salah, and custom azkar were not touched.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); return prisma.$disconnect().finally(() => process.exit(1)) })
