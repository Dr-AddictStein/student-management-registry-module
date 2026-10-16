import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { PlaceholderTable } from "@/components/placeholder-table"
import { RoleContent } from "@/components/role-provider"

export const metadata: Metadata = {
  title: "Assessments",
}

export default function AssessmentsPage() {
  return (
    <RoleContent
      staff={
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
      }
      student={
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
      }
    />
  )
}
