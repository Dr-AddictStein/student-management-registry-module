import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AssessmentSections } from "@/components/assessment-sections"
import { ConfirmDelete } from "@/components/confirm-delete"
import { DataTable } from "@/components/data-table"
import { ListPagination } from "@/components/list-pagination"
import { OpenSubmission } from "@/components/open-submission"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { toDateTimeInput } from "@/lib/inputs"
import { pageHref, paginate, parsePage } from "@/lib/pagination"
import { prisma } from "@/lib/prisma"
import { deleteSubmission } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"

export default function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading submissions…</p>}>
      <SubmissionsContent searchParams={searchParams} />
    </Suspense>
  )
}

async function SubmissionsContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await requireSession()
  if (session.role !== "staff") redirect("/assessments")

  const params = await searchParams
  const requested = parsePage(params.page)
  const total = await prisma.submission.count()
  const page = paginate(requested, total)
  if (requested !== page.current) redirect(pageHref("/assessments/submissions", page.current))

  const submissions = await prisma.submission.findMany({
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    skip: page.skip,
    take: page.pageSize,
    include: {
      student: { select: { fullName: true, studentNumber: true } },
      assessment: { select: { title: true } },
    },
  })

  return (
    <>
      <AssessmentSections current="submissions" />
      <PageHeader
        title="Submissions"
        description="Open a file to read it in a new tab. A PDF opens in the browser, and a Word document opens as text. The file name downloads the original."
      />
      <DataTable
        rows={submissions}
        rowKey={(submission) => submission.id}
        empty="No submissions yet."
        columns={[
          { key: "student", header: "Student", cell: (submission) => `${submission.student.studentNumber} ${submission.student.fullName}` },
          { key: "assessment", header: "Assessment", cell: (submission) => submission.assessment.title },
          {
            key: "file",
            header: "File",
            className: "whitespace-normal",
            cell: (submission) => (
              <div className="flex flex-col items-center gap-2">
                <span>
                  <a href={`/api/submissions/${submission.id}`} className="underline-offset-4 hover:underline">
                    {submission.originalFileName}
                  </a>
                  {submission.isLate ? <Badge variant="destructive" className="ml-2">Late</Badge> : null}
                </span>
                <OpenSubmission id={submission.id} />
              </div>
            ),
          },
          { key: "handed", header: "Handed in (UTC)", cell: (submission) => toDateTimeInput(submission.submittedAt).replace("T", " ") },
          {
            key: "actions",
            header: "",
            cell: (submission) => (
              <ConfirmDelete action={deleteSubmission} id={submission.id} label={submission.originalFileName} />
            ),
          },
        ]}
      />
      <ListPagination pathname="/assessments/submissions" {...page} />
    </>
  )
}
