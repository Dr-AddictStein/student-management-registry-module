import { Suspense } from "react"
import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth-form"
import { formatAmount } from "@/lib/domain"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Create a student account",
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading programmes…</p>}>
      <RegisterContent />
    </Suspense>
  )
}

async function RegisterContent() {
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, feeAmount: true },
  })

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Student registration</h1>
      <p className="mt-2 mb-6 text-sm leading-6 text-muted-foreground">
        Register once with your enrolment details. After that, sign in to open your dashboard.
      </p>
      {programmes.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          No programmes are in the register yet. Run the seed script, then come back.
        </p>
      ) : (
        <RegisterForm
          programmes={programmes.map((programme) => ({
            id: programme.id,
            code: programme.code,
            name: programme.name,
            fee: formatAmount(programme.feeAmount),
          }))}
        />
      )}
    </>
  )
}
