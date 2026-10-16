import Link from "next/link"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RoleContent } from "@/components/role-provider"
import { PageHeader } from "@/components/page-header"

const staffWorkflows = [
  {
    href: "/students",
    title: "Student enrolment",
    description:
      "Create a record, issue a student ID, and search the register by name, ID, programme, or status.",
  },
  {
    href: "/fees",
    title: "Fees and payments",
    description:
      "Assign the programme fee, record payments, and see who still has an overdue balance.",
  },
  {
    href: "/assessments",
    title: "Assessments",
    description:
      "Open an assessment with a module and a deadline, then receive one submission per student.",
  },
  {
    href: "/results",
    title: "Marksheet and results",
    description:
      "Enter a grade from 0 to 100, classify it, and publish or withhold it for that student.",
  },
]

const studentWorkflows = [
  {
    href: "/assessments",
    title: "Submit work",
    description:
      "Upload a PDF or DOCX against an open assessment. A later file replaces the earlier one until the deadline.",
  },
  {
    href: "/results",
    title: "Marksheet",
    description:
      "Published grades appear here. Withheld results stay hidden.",
  },
  {
    href: "/fees",
    title: "Fees",
    description: "See the fee for your programme, what you have paid, and what is still outstanding.",
  },
]

export default function HomePage() {
  return (
    <RoleContent
      staff={
        <>
          <PageHeader
            title="Registry"
            description="The four jobs the registry desk does every day. Each screen will read and write PostgreSQL. Nothing on this page is sample data."
          />
          <WorkflowGrid items={staffWorkflows} />
        </>
      }
      student={
        <>
          <PageHeader
            title="My record"
            description="Use the student view to submit work, check published results, and see your fee balance. Choosing which student you are viewing will be wired up with enrolment."
          />
          <WorkflowGrid items={studentWorkflows} />
        </>
      }
    />
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
