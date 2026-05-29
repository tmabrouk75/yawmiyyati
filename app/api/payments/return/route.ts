// app/api/payments/return/route.ts
// Paymob redirects user here after checkout (success or failure)
// This is NOT the source of truth — the webhook is. This just handles UX redirect.

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const success  = searchParams.get('success') === 'true'
  const pending  = searchParams.get('pending') === 'true'
  const planKey  = searchParams.get('planKey') ?? ''
  const isTheme  = planKey.startsWith('theme_')

  // Theme purchase return
  if (isTheme) {
    if (success) {
      return NextResponse.redirect(new URL('/themes?payment=success', req.url))
    }
    if (pending) {
      return NextResponse.redirect(new URL('/themes?payment=pending', req.url))
    }
    return NextResponse.redirect(new URL('/themes?payment=failed', req.url))
  }

  // Premium subscription return
  if (success) {
    return NextResponse.redirect(new URL('/premium?payment=success', req.url))
  }
  if (pending) {
    return NextResponse.redirect(new URL('/premium?payment=pending', req.url))
  }
  return NextResponse.redirect(new URL('/premium?payment=failed', req.url))
}
