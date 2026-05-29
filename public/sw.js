// Yawmiyyati Service Worker — Prayer Time Notifications
// Handles background push notifications and caching

const CACHE_NAME = 'yawmiyyati-v1'
const OFFLINE_URL = '/offline'

// ─── INSTALL ─────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([OFFLINE_URL, '/', '/icons/icon-192.png'])
    )
  )
  self.skipWaiting()
})

// ─── ACTIVATE ────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── FETCH — offline fallback ─────────────────────────────

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    )
  }
})

// ─── PUSH NOTIFICATION ────────────────────────────────────
// Triggered by the server or scheduled via postMessage

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      tag:     data.tag ?? 'prayer',
      silent:  false,
      vibrate: [200, 100, 200],
      data:    { url: data.url ?? '/' },
    })
  )
})

// ─── NOTIFICATION CLICK ───────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/today'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})

// ─── SCHEDULED PRAYER ALARMS ──────────────────────────────
// The app sends prayer times via postMessage when user grants permission
// SW stores them and fires notifications at the right time

const scheduledAlarms = new Map()

self.addEventListener('message', (event) => {
  const { type, alarms } = event.data ?? {}

  if (type === 'SCHEDULE_PRAYER_ALARMS' && Array.isArray(alarms)) {
    // Clear existing alarms
    scheduledAlarms.forEach(id => clearTimeout(id))
    scheduledAlarms.clear()

    const now = Date.now()
    alarms.forEach(alarm => {
      const delay = alarm.time - now
      if (delay <= 0) return  // already passed

      const timeoutId = setTimeout(async () => {
        await self.registration.showNotification(`🕌 ${alarm.prayerName}`, {
          body:    alarm.body,
          icon:    '/icons/icon-192.png',
          badge:   '/icons/icon-72.png',
          tag:     `prayer-${alarm.key}`,
          silent:  false,
          vibrate: [200, 100, 200],
          data:    { url: '/today' },
        })
        scheduledAlarms.delete(alarm.key)
      }, delay)

      scheduledAlarms.set(alarm.key, timeoutId)
    })

    // Confirm to the app
    event.source?.postMessage({ type: 'ALARMS_SCHEDULED', count: alarms.length })
  }
})
