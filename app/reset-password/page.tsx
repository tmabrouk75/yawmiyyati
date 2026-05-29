import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/screens/PasswordReset'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"/></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
