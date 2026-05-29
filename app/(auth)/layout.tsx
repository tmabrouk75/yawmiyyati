export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 bg-white">
      {children}
    </div>
  )
}
