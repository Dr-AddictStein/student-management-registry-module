import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="min-h-full flex-1 bg-background" />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  )
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session) redirect("/")

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
          PEN Registry
        </p>
        <div className="mt-3">
          <Suspense fallback={<div className="h-40" />}>{children}</Suspense>
        </div>
      </div>
    </div>
  )
}
