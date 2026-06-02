'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // If the build manifest is missing (new deployment while user had old version open),
    // force a full hard reload to pick up the new deployment
    const isManifestError =
      error?.message?.includes('app-build-manifest') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('ChunkLoadError')

    if (isManifestError) {
      window.location.reload()
      return
    }

    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', gap: '16px',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Something went wrong</p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
            {error?.digest ? `Ref: ${error.digest}` : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#059669', color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reload app
          </button>
        </div>
      </body>
    </html>
  )
}
