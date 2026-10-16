import { Suspense } from "react"
import { RegistryShell } from "@/components/registry-shell"
import { requireSession } from "@/lib/session"

export default function RegistryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="min-h-full flex-1 bg-background" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  )
}

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  return <RegistryShell session={session}>{children}</RegistryShell>
}
