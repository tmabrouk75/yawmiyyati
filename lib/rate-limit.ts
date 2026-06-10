// Simple in-memory sliding-window rate limiter.
//
// Scope: per serverless instance. On Vercel each warm lambda keeps its own
// window, so the real-world ceiling is (limit x instances). That still stops
// dumb brute force and email flooding. If the app grows, swap the Map for
// Upstash Redis behind the same function signature.

import { NextRequest } from 'next/server'

type Window = { count: number; resetAt: number }

const store = new Map<string, Window>()

// Periodic cleanup so the Map does not grow unbounded on a warm instance
const CLEANUP_EVERY = 5 * 60 * 1000
let lastCleanup = Date.now()
function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_EVERY) return
  lastCleanup = now
  for (const [key, w] of store) {
    if (w.resetAt <= now) store.delete(key)
  }
}

export function getClientIp(req: NextRequest): string {
  // Vercel sets x-forwarded-for; first entry is the client
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Returns { ok: false, retryAfterSec } when the key exceeded `limit`
 * requests within `windowMs`.
 *
 * Key should combine the action and the identifier,
 * e.g. `login:1.2.3.4` or `forgot:user@mail.com`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  cleanup(now)

  const w = store.get(key)
  if (!w || w.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  w.count++
  if (w.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((w.resetAt - now) / 1000) }
  }
  return { ok: true }
}

export function tooManyRequests(retryAfterSec: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSec),
    },
  })
}
