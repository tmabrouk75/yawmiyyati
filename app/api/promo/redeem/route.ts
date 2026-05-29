import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { validatePromoCode, redeemPromoCode } from '@/lib/promo'

// POST /api/promo/redeem
// Body: { code: string }
// Validates and redeems a promo code for the logged-in user
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await req.json()
    if (!code?.trim()) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const result = await redeemPromoCode(code.trim(), user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success:      true,
      type:         result.type,
      premiumDays:  result.premiumDays,
      premiumUntil: result.premiumUntil,
      labelEn:      result.labelEn,
      labelAr:      result.labelAr,
    })
  } catch (error) {
    console.error('[PROMO REDEEM]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// GET /api/promo/validate?code=XXXX
// Validates a code without redeeming it — used for live feedback as user types
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const code = req.nextUrl.searchParams.get('code')
    if (!code?.trim()) {
      return NextResponse.json({ valid: false, error: 'Code is required' })
    }

    const result = await validatePromoCode(code.trim(), user.id)

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error, errorAr: result.errorAr })
    }

    const promo = result.code
    return NextResponse.json({
      valid:       true,
      type:        promo.type,
      premiumDays: promo.premiumDays,
      discountPct: promo.discountPct,
      labelEn:     promo.labelEn,
      labelAr:     promo.labelAr,
    })
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Something went wrong' })
  }
}
