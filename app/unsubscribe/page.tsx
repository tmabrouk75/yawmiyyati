import { Suspense } from 'react'
import UnsubscribeContent from './UnsubscribeContent'

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"/></div>}>
      <UnsubscribeContent />
    </Suspense>
  )
}
