// Middleware handles root redirect:
// Logged in  → /today
// Guest      → /welcome
// This file is a fallback only — should rarely render.

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/welcome')
}
