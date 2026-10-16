import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { PaymentForm } from "@/components/registry-forms"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatAmount, formatDisplayDate } from "@/lib/domain"
import { isOverdue, outstandingBalance, sumPayments } from "@/lib/fees"
import { moneyInput, toDateInput } from "@/lib/inputs"
import { prisma } from "@/lib/prisma"
import { deletePayment } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { EmptyRow, Notice, RecordTable, RowActions } from "@/components/record-list"

export default function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>
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
  searchParams: Promise<{ edit?: string; error?: string }>
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
        <RecordTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.payments.length === 0 ? (
                <EmptyRow span={3} message="No payments have been recorded yet." />
              ) : (
                student.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDisplayDate(payment.paidOn)}</TableCell>
                    <TableCell>{payment.reference}</TableCell>
                    <TableCell>{formatAmount(payment.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </RecordTable>
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
  const editing = payments.find((payment) => payment.id === params.edit)

  return (
    <>
      <PageHeader
        title="Fees and payments"
        description="The outstanding balance is the assigned fee minus recorded payments. It is overdue only after the due date."
      />
      <Notice message={params.error} />
      <RecordTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <EmptyRow span={6} message="Enrol a student before recording a payment." />
            ) : (
              students.map((student) => {
                const paid = sumPayments(student.payments)
                const balance = outstandingBalance(student.assignedFee, paid)
                const overdue = isOverdue(balance, student.feeDueDate)
                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.studentNumber} {student.fullName}</TableCell>
                    <TableCell>{student.programme.name}</TableCell>
                    <TableCell>{formatAmount(student.assignedFee)}</TableCell>
                    <TableCell>{formatAmount(paid)}</TableCell>
                    <TableCell>
                      {formatAmount(balance)}
                      {overdue ? <Badge variant="destructive" className="ml-2">Overdue</Badge> : null}
                    </TableCell>
                    <TableCell>{formatDisplayDate(student.feeDueDate)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </RecordTable>
      {students.length > 0 ? (
        <section className="my-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <PaymentForm
            students={students.map((student) => ({
              id: student.id,
              label: `${student.studentNumber} — ${student.fullName}`,
            }))}
            payment={
              editing
                ? {
                    id: editing.id,
                    studentId: editing.studentId,
                    amount: moneyInput(editing.amount),
                    paidOn: toDateInput(editing.paidOn),
                    reference: editing.reference,
                  }
                : undefined
            }
          />
          {editing ? (
            <Link href="/fees" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
              Cancel editing
            </Link>
          ) : null}
        </section>
      ) : null}
      <RecordTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <EmptyRow span={5} message="No payments recorded yet." />
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDisplayDate(payment.paidOn)}</TableCell>
                  <TableCell>{payment.student.studentNumber} {payment.student.fullName}</TableCell>
                  <TableCell>{payment.reference}</TableCell>
                  <TableCell>{formatAmount(payment.amount)}</TableCell>
                  <TableCell>
                    <RowActions
                      editHref={`/fees?edit=${payment.id}`}
                      id={payment.id}
                      label={payment.reference}
                      action={deletePayment}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </RecordTable>
    </>
  )
}
