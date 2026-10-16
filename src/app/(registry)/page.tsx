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
import { loadStudent } from "@/lib/current-student"
import { requireSession } from "@/lib/session"

const staffWorkflows = [
  {
    href: "/students",
    title: "Student enrolment",
    description: "Search the register and manage enrolment status.",
  },
  {
    href: "/fees",
    title: "Fees and payments",
    description: "Record payments and see who still has an overdue balance.",
  },
  {
    href: "/assessments",
    title: "Assessments",
    description: "Open an assessment with a module and a submission deadline.",
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

  return (
    <>
      <PageHeader
        title="Registry"
        description="The desk dashboard. Overdue balances will be flagged here once fees are connected. Students register themselves and then appear on the register."
      />
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
