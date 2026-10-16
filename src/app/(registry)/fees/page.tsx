import { Suspense } from "react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { PlaceholderTable } from "@/components/placeholder-table"
import { requireSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Fees",
}

export default function FeesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading fees…</p>}>
      <FeesContent />
    </Suspense>
  )
}

async function FeesContent() {
  const session = await requireSession()

  if (session.role === "student") {
    return (
      <>
        <PageHeader
          title="My fees"
          description="Your assigned fee, the payments recorded against it, and the amount still outstanding."
        />
        <PlaceholderTable
          columns={["Date", "Reference", "Amount"]}
          message="Payment history will be listed here."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Fees and payments"
        description="Each student is assigned the fee for their programme. Payments reduce the balance. A balance still open after the due date is overdue."
      />
      <PlaceholderTable
        columns={["Student", "Programme", "Assigned fee", "Paid", "Outstanding", "Due"]}
        message="Outstanding balances will be calculated from assigned fees and payment records."
      />
    </>
  )
}
