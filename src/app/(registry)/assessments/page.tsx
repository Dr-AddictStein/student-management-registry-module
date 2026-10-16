import { Suspense } from "react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { PlaceholderTable } from "@/components/placeholder-table"
import { requireSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Assessments",
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading assessments…</p>}>
      <AssessmentsContent />
    </Suspense>
  )
}

async function AssessmentsContent() {
  const session = await requireSession()

  if (session.role === "student") {
    return (
      <>
        <PageHeader
          title="Assessments"
          description="Upload a PDF or DOCX for an open assessment on your programme. Sending another file replaces the previous one."
        />
        <PlaceholderTable
          columns={["Assessment", "Module", "Deadline", "Your submission"]}
          message="Open assessments and your submission status will appear here."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Staff open an assessment with a title, a module, and a submission deadline. Each student has one submission, which they can replace before the deadline. Late files are kept and flagged."
      />
      <PlaceholderTable
        columns={["Title", "Module", "Deadline", "Submissions"]}
        message="Assessments will be listed from the database. Creating one is not connected yet."
      />
    </>
  )
}
