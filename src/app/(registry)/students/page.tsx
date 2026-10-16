import { Suspense } from "react"
import type { Metadata } from "next"
import { EnrolmentSummary } from "@/components/enrolment-summary"
import { PageHeader } from "@/components/page-header"
import { PlaceholderTable } from "@/components/placeholder-table"
import { loadStudent } from "@/lib/current-student"
import { requireSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Students",
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading enrolment…</p>}>
      <StudentsContent />
    </Suspense>
  )
}

async function StudentsContent() {
  const session = await requireSession()

  if (session.role === "student") {
    const student = await loadStudent(session.studentId)
    return (
      <>
        <PageHeader
          title="My enrolment"
          description="The registry issued this student ID when you registered. Status changes are made by staff."
        />
        <EnrolmentSummary student={student} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Students"
        description="Search and filters will query the student table. New students join by registering. Staff management of status comes next."
      />
      <PlaceholderTable
        columns={["Student ID", "Name", "Email", "Programme", "Academic year", "Status"]}
        message="The register list is not connected yet."
      />
    </>
  )
}
