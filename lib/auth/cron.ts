import { NextRequest } from 'next/server'

/**
 * Verifies a request comes from Vercel Cron (or a manual trusted call).
 *
 * Vercel Cron invokes the path with GET and sends:
 *   Authorization: Bearer <CRON_SECRET>
 * (only when the CRON_SECRET env var is set on the project).
 *
 * Fallbacks kept for manual testing:
 *   - x-cron-secret header
 *   - ?secret= query param
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const bearer = req.headers.get('authorization')
  if (bearer === `Bearer ${cronSecret}`) return true

  const header = req.headers.get('x-cron-secret')
  if (header === cronSecret) return true

  const param = req.nextUrl.searchParams.get('secret')
  if (param === cronSecret) return true

  return false
}
