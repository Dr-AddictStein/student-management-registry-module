import { Suspense } from "react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { PlaceholderTable } from "@/components/placeholder-table"
import { requireSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Results",
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading results…</p>}>
      <ResultsContent />
    </Suspense>
  )
}

async function ResultsContent() {
  const session = await requireSession()

  if (session.role === "student") {
    return (
      <>
        <PageHeader
          title="My results"
          description="You only see a grade after staff have published it. Withheld results are not listed."
        />
        <PlaceholderTable
          columns={["Assessment", "Module", "Grade", "Classification"]}
          message="Published results will appear here."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Marksheet and results"
        description="Enter a grade from 0 to 100 for each student on an assessment. Pass is 40, Merit is 60, and Distinction is 70. Publish a result to release it. Withheld results stay on the staff marksheet only."
      />
      <PlaceholderTable
        columns={["Student", "Assessment", "Grade", "Classification", "Published"]}
        message="Grades will be entered and published from this marksheet."
      />
    </>
  )
}
