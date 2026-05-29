import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword, signToken, setAuthCookie, validateEmail, validatePassword } from '@/lib/auth'
import { generateReferralCode, PREMIUM_DAYS_PER_REDEMPTION } from '@/lib/referral'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, language = 'EN', refCode } = body

    // ── Validate
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 })
    }

    // ── Check existing user
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // ── Validate referral code (if provided)
    let referrer = null
    if (refCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode: refCode },
        select: { id: true },
      })
      // silently ignore invalid codes — don't block registration
    }

    // ── Create user — grant admin + premium if this is the owner account
    const passwordHash = await hashPassword(password)
    const isOwnerAccount = email.toLowerCase() === 't.mabrouk@outlook.com'

    // New user via referral gets 1 month premium free
    const referralPremiumExpiry = referrer
      ? new Date(Date.now() + PREMIUM_DAYS_PER_REDEMPTION * 24 * 60 * 60 * 1000)
      : null

    // Generate unique referral code for new user
    let newUserCode = generateReferralCode()
    while (await prisma.user.findUnique({ where: { referralCode: newUserCode } })) {
      newUserCode = generateReferralCode()
    }

    const user = await prisma.user.create({
      data: {
        name,
        email:           email.toLowerCase(),
        passwordHash,
        language:        language as 'EN' | 'AR',
        isAdmin:         isOwnerAccount,
        isPremium:       isOwnerAccount || !!referrer,
        premiumExpiresAt: isOwnerAccount ? null : referralPremiumExpiry,
        referralCode:    newUserCode,
        referredByCode:  refCode ?? null,
      },
    })

    // ── Seed default activity settings (Fard prayers ON by default)
    const activityDefs = await prisma.activityDefinition.findMany()

    await prisma.userActivity.createMany({
      data: activityDefs.map((def, i) => ({
        userId: user.id,
        activityDefinitionId: def.id,
        isEnabled: def.defaultOn,
        sortOrder: i,
      })),
    })

    // ── Create initial Qada' record for current Hijri year
    const { toHijri } = await import('@/lib/hijri')
    const hijri = toHijri(new Date())
    await prisma.qadaRecord.create({
      data: {
        userId: user.id,
        ramadanYear: hijri.year,
        totalOwed: 0,
        totalCompensated: 0,
      },
    })

    // ── Create referral record if signed up via a referral link
    if (referrer) {
      // Check for an existing SENT record for this email and upgrade it
      const sentRecord = await prisma.referral.findFirst({
        where: { referrerId: referrer.id, sentToEmail: email.toLowerCase(), status: 'SENT' },
      })

      if (sentRecord) {
        await prisma.referral.update({
          where: { id: sentRecord.id },
          data:  {
            referredId: user.id,
            status:     'PENDING',
            signedUpAt: new Date(),
          },
        })
      } else {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            status:     'PENDING',
            signedUpAt: new Date(),
          },
        })
      }
    }

    // ── Sign token and set cookie
    const token = signToken({
      userId: user.id,
      email: user.email,
      isPremium: isOwnerAccount,
      isAdmin:   isOwnerAccount,
    })

    setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
        isPremium: false,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
