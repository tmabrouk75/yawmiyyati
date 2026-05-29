import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { toHijri, getSeasonalActivities } from "@/lib/hijri"
import DailyEntry from "@/components/screens/DailyEntry"

export default async function TodayPage({
  searchParams,
}: {
  searchParams?: { date?: string }
}) {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  // Allow browsing past days via ?date=YYYY-MM-DD; future dates clamped to today
  const todayReal = new Date()
  todayReal.setHours(0, 0, 0, 0)

  let today = todayReal
  if (searchParams?.date) {
    // Parse as LOCAL date to avoid UTC timezone off-by-one shift
    const parts = searchParams.date.split('-').map(Number)
    if (parts.length === 3 && parts.every(n => !isNaN(n))) {
      const parsed = new Date(parts[0], parts[1] - 1, parts[2]) // local midnight
      if (parsed.getTime() <= todayReal.getTime()) today = parsed
    }
  }
  const isToday = today.getTime() === todayReal.getTime()

  const hijri    = toHijri(today)
  const seasonal = getSeasonalActivities(today)

  const userActivities = await prisma.userActivity.findMany({
    where: { userId: user.id, isEnabled: true },
    include: { activityDefinition: true },
    orderBy: { sortOrder: "asc" },
  })
  const enabledKeys = new Set(userActivities.map(a => a.activityDefinition.key))

  let dailyLog = await prisma.dailyLog.findUnique({
    where: { userId_dateGregorian: { userId: user.id, dateGregorian: today } },
    include: {
      prayerLog: true, dhikrLog: true,
      quranLog: { include: { surahChecks: true } },
      fastingLog: true, sadaqahLog: true,
    },
  })

  if (!dailyLog) {
    dailyLog = await prisma.dailyLog.create({
      data: {
        userId: user.id, dateGregorian: today,
        dateHijriYear: hijri.year, dateHijriMonth: hijri.month, dateHijriDay: hijri.day,
      },
      include: {
        prayerLog: true, dhikrLog: true,
        quranLog: { include: { surahChecks: true } },
        fastingLog: true, sadaqahLog: true,
      },
    })
  }

  const qadaRecord = await prisma.qadaRecord.findFirst({
    where: { userId: user.id, ramadanYear: hijri.year },
  })
  const userSurahs = await prisma.userSurah.findMany({
    where: { userId: user.id, isEnabled: true },
    orderBy: { sortOrder: "asc" },
  })

  const pad = (n: number) => String(n).padStart(2, '0')
  const selectedDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  return (
    <DailyEntry
      lang={user.language === "AR" ? "ar" : "en"}
      userId={user.id}
      userName={user.name ?? ''}
      country={user.country ?? "EG"}
      seasonal={seasonal}
      enabledKeys={enabledKeys}
      qadaRemaining={qadaRecord ? qadaRecord.totalOwed - qadaRecord.totalCompensated : 0}
      gender={user.gender ?? null}
      selectedDate={selectedDate}
      isToday={isToday}
      initialIsPeriod={dailyLog.isPeriod ?? false}
      userSurahs={userSurahs}
      initialPrayer={dailyLog.prayerLog}
      initialDhikr={dailyLog.dhikrLog}
      initialQuran={dailyLog.quranLog}
      initialFasting={dailyLog.fastingLog}
      initialSadaqah={dailyLog.sadaqahLog}
    />
  )
}
