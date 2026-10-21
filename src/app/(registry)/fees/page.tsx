import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { PaymentForm } from "@/components/registry-forms"
import { Badge } from "@/components/ui/badge"
import { formatAmount, formatDisplayDate } from "@/lib/domain"
import { isOverdue, outstandingBalance, sumPayments } from "@/lib/fees"
import { moneyInput, toDateInput } from "@/lib/inputs"
import { prisma } from "@/lib/prisma"
import { deletePayment } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { DataTable } from "@/components/data-table"
import { RecordModal } from "@/components/record-modal"
import { Notice, RowActions } from "@/components/record-list"

export default function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading fees…</p>}>
      <FeesContent searchParams={searchParams} />
    </Suspense>
  )
}

async function FeesContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireSession()
  const params = await searchParams

  if (session.role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      include: { payments: { orderBy: { paidOn: "desc" } }, programme: { select: { name: true } } },
    })
    if (!student) redirect("/api/logout")
    const paid = sumPayments(student.payments)
    const balance = outstandingBalance(student.assignedFee, paid)
    return (
      <>
        <PageHeader
          title="My fees"
          description={`${student.programme.name}. Payments are recorded by the registry.`}
        />
        <p className="mb-4 text-sm">
          Assigned {formatAmount(student.assignedFee)} · Paid {formatAmount(paid)} · Outstanding {formatAmount(balance)}
          {isOverdue(balance, student.feeDueDate) ? " · Overdue" : ""}
        </p>
        <DataTable
          rows={student.payments}
          rowKey={(payment) => payment.id}
          empty="No payments have been recorded yet."
          columns={[
            { key: "date", header: "Date", cell: (payment) => formatDisplayDate(payment.paidOn) },
            { key: "reference", header: "Reference", cell: (payment) => payment.reference },
            { key: "amount", header: "Amount", cell: (payment) => formatAmount(payment.amount) },
          ]}
        />
      </>
    )
  }

  const [students, payments] = await Promise.all([
    prisma.student.findMany({
      orderBy: { studentNumber: "asc" },
      include: { payments: { select: { amount: true } }, programme: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { paidOn: "desc" },
      include: { student: { select: { fullName: true, studentNumber: true } } },
    }),
  ])
  const studentOptions = students.map((student) => ({
    id: student.id,
    label: `${student.studentNumber} — ${student.fullName}`,
  }))
  const balances = students.map((student) => {
    const paid = sumPayments(student.payments)
    const balance = outstandingBalance(student.assignedFee, paid)
    return { student, paid, balance, overdue: isOverdue(balance, student.feeDueDate) }
  })

  return (
    <>
      <PageHeader
        title="Fees and payments"
        description="The outstanding balance is the assigned fee minus recorded payments. It is overdue only after the due date."
        action={
          students.length > 0 ? (
            <RecordModal title="Record payment" trigger="Record payment">
              <PaymentForm students={studentOptions} />
            </RecordModal>
          ) : null
        }
      />
      <Notice message={params.error} />
      <DataTable
        rows={balances}
        rowKey={(row) => row.student.id}
        empty="Enrol a student before recording a payment."
        columns={[
          { key: "student", header: "Student", cell: (row) => `${row.student.studentNumber} ${row.student.fullName}` },
          { key: "programme", header: "Programme", cell: (row) => row.student.programme.name },
          { key: "assigned", header: "Assigned", cell: (row) => formatAmount(row.student.assignedFee) },
          { key: "paid", header: "Paid", cell: (row) => formatAmount(row.paid) },
          {
            key: "outstanding",
            header: "Outstanding",
            cell: (row) => (
              <>
                {formatAmount(row.balance)}
                {row.overdue ? <Badge variant="destructive" className="ml-2">Overdue</Badge> : null}
              </>
            ),
          },
          { key: "due", header: "Due", cell: (row) => formatDisplayDate(row.student.feeDueDate) },
        ]}
      />
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Payments</h2>
      <DataTable
        rows={payments}
        rowKey={(payment) => payment.id}
        empty="No payments recorded yet."
        columns={[
          { key: "date", header: "Date", cell: (payment) => formatDisplayDate(payment.paidOn) },
          { key: "student", header: "Student", cell: (payment) => `${payment.student.studentNumber} ${payment.student.fullName}` },
          { key: "reference", header: "Reference", cell: (payment) => payment.reference },
          { key: "amount", header: "Amount", cell: (payment) => formatAmount(payment.amount) },
          {
            key: "actions",
            header: "",
            cell: (payment) => (
              <RowActions
                id={payment.id}
                label={payment.reference}
                action={deletePayment}
                edit={
                  <RecordModal title="Edit payment" trigger="Edit" appearance="edit">
                    <PaymentForm
                      students={studentOptions}
                      payment={{
                        id: payment.id,
                        studentId: payment.studentId,
                        amount: moneyInput(payment.amount),
                        paidOn: toDateInput(payment.paidOn),
                        reference: payment.reference,
                      }}
                    />
                  </RecordModal>
                }
              />
            ),
          },
        ]}
      />
      </div>
    </>
  )
}
