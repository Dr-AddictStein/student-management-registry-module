import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { PlaceholderTable } from "@/components/placeholder-table"
import { RoleContent } from "@/components/role-provider"

export const metadata: Metadata = {
  title: "Fees",
}

export default function FeesPage() {
  return (
    <RoleContent
      staff={
        <>
          <PageHeader
            title="Fees and payments"
            description="Each student is assigned the fee for their programme. Payments reduce the balance. A balance still open after the due date is overdue."
          />
          <PlaceholderTable
            columns={[
              "Student",
              "Programme",
              "Assigned fee",
              "Paid",
              "Outstanding",
              "Due",
            ]}
            message="Outstanding balances will be calculated from assigned fees and payment records."
          />
        </>
      }
      student={
        <>
          <PageHeader
            title="My fees"
            description="Your assigned fee, the payments recorded against it, and the amount still outstanding."
          />
          <PlaceholderTable
            columns={["Date", "Reference", "Amount"]}
            message="Payment history for the selected student will be listed here."
          />
        </>
      }
    />
  )
}
