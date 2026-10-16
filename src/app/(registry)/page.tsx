import { Suspense } from "react"
import Link from "next/link"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EnrolmentSummary } from "@/components/enrolment-summary"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { formatAmount, formatDisplayDate } from "@/lib/domain"
import { isOverdue, outstandingBalance, sumPayments } from "@/lib/fees"
import { loadStudent } from "@/lib/current-student"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/session"

const staffWorkflows = [
  {
    href: "/programmes",
    title: "Programmes",
    description: "Add a programme and the fee students are charged when they enrol.",
  },
  {
    href: "/modules",
    title: "Modules",
    description: "Add the modules that assessments belong to.",
  },
  {
    href: "/students",
    title: "Student enrolment",
    description: "Add, search, and update students. The student ID is issued here.",
  },
  {
    href: "/fees",
    title: "Fees and payments",
    description: "Record payments and see the live outstanding balance.",
  },
  {
    href: "/assessments",
    title: "Assessments",
    description: "Create an assessment with a module and a deadline.",
  },
  {
    href: "/results",
    title: "Marksheet and results",
    description: "Enter a grade and publish or withhold it for that student.",
  },
]

const studentWorkflows = [
  {
    href: "/assessments",
    title: "Submit work",
    description: "Upload a PDF or DOCX against an open assessment.",
  },
  {
    href: "/results",
    title: "Marksheet",
    description: "Published grades appear here. Withheld results stay hidden.",
  },
  {
    href: "/fees",
    title: "Fees",
    description: "See the fee for your programme and what is still outstanding.",
  },
]

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading your dashboard…</p>}>
      <Dashboard />
    </Suspense>
  )
}

async function Dashboard() {
  const session = await requireSession()

  if (session.role === "student") {
    const student = await loadStudent(session.studentId)
    return (
      <>
        <PageHeader
          title={`Welcome, ${student.fullName.split(" ")[0]}`}
          description="This is your student dashboard. Your enrolment record is below. Submissions, results, and fees open from here."
        />
        <EnrolmentSummary student={student} />
        <div className="mt-6">
          <WorkflowGrid items={studentWorkflows} />
        </div>
      </>
    )
  }

  const students = await prisma.student.findMany({
    orderBy: { feeDueDate: "asc" },
    include: { payments: { select: { amount: true } }, programme: { select: { name: true } } },
  })
  const overdue = students.flatMap((student) => {
    const balance = outstandingBalance(student.assignedFee, sumPayments(student.payments))
    if (!isOverdue(balance, student.feeDueDate)) return []
    return [{ student, balance }]
  })

  return (
    <>
      <PageHeader
        title="Registry"
        description="Create programmes, modules, students, assessments, payments, and grades from these screens. Nothing has to be inserted in the database by hand."
      />
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Overdue balances</h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No student has an overdue balance.</p>
        ) : (
          <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
            {overdue.map(({ student, balance }) => (
              <li key={student.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  {student.studentNumber} {student.fullName}
                  <span className="text-muted-foreground"> · {student.programme.name}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  {formatAmount(balance)} due {formatDisplayDate(student.feeDueDate)}
                  <Badge variant="destructive">Overdue</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <WorkflowGrid items={staffWorkflows} />
    </>
  )
}

function WorkflowGrid({
  items,
}: {
  items: { href: string; title: string; description: string }[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="block">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
