import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { toHijri } from '@/lib/hijri'

// GET /api/settings/qada — get all Qada records
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const records = await prisma.qadaRecord.findMany({
    where: { userId: user.id },
    orderBy: { ramadanYear: 'desc' },
  })

  return NextResponse.json({
    records: records.map(r => ({
      ...r,
      remaining: r.totalOwed - r.totalCompensated,
    })),
  })
}

// POST /api/settings/qada — set owed days for a Ramadan year
// Body: { ramadanYear?, totalOwed }
// If no ramadanYear provided, uses the current Hijri year
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const hijri = toHijri(new Date())
  const ramadanYear = body.ramadanYear ?? hijri.year
  const totalOwed   = Number(body.totalOwed)

  if (isNaN(totalOwed) || totalOwed < 0 || totalOwed > 30) {
    return NextResponse.json({ error: 'totalOwed must be between 0 and 30' }, { status: 400 })
  }

  const record = await prisma.qadaRecord.upsert({
    where: { userId_ramadanYear: { userId: user.id, ramadanYear } },
    create: { userId: user.id, ramadanYear, totalOwed, totalCompensated: 0 },
    update: { totalOwed },
  })

  return NextResponse.json({
    record: { ...record, remaining: record.totalOwed - record.totalCompensated },
  })
}
