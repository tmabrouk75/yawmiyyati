import { Suspense } from 'react'
import PaymentSuccessContent from './PaymentSuccessContent'

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"/></div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
