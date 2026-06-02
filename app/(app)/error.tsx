'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center gap-4">
      <div className="text-[40px]">⚠️</div>
      <p className="text-[16px] font-semibold text-gray-800">Something went wrong</p>
      <p className="text-[13px] text-gray-400 leading-relaxed">
        {error?.message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      {error?.digest && (
        <p className="text-[10px] text-gray-300 font-mono">Digest: {error.digest}</p>
      )}
      <div className="flex flex-col gap-2 w-full max-w-[280px] mt-2">
        <button
          onClick={reset}
          className="w-full py-[12px] rounded-[12px] bg-emerald-600 text-white text-[13px] font-semibold"
        >
          Try again
        </button>
        <button
          onClick={() => router.push('/today')}
          className="w-full py-[12px] rounded-[12px] border border-gray-200 text-gray-600 text-[13px]"
        >
          Go to Today
        </button>
      </div>
    </div>
  )
}
