import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ConfirmDelete } from "@/components/confirm-delete"
import { PageHeader } from "@/components/page-header"
import { AssessmentForm } from "@/components/registry-forms"
import { SubmissionForm } from "@/components/submission-form"
import { Badge } from "@/components/ui/badge"
import { formatDisplayDate } from "@/lib/domain"
import { toDateTimeInput } from "@/lib/inputs"
import { prisma } from "@/lib/prisma"
import { deleteAssessment, deleteSubmission } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { DataTable } from "@/components/data-table"
import { RecordModal } from "@/components/record-modal"
import { OpenSubmission } from "@/components/open-submission"
import { Notice, RowActions } from "@/components/record-list"

export default function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading assessments…</p>}>
      <AssessmentsContent searchParams={searchParams} />
    </Suspense>
  )
}

async function AssessmentsContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireSession()
  const params = await searchParams

  if (session.role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: { programmeId: true, enrolmentStatus: true },
    })
    if (!student) redirect("/api/logout")
    const assessments = await prisma.assessment.findMany({
      where: { module: { programmeId: student.programmeId } },
      orderBy: { deadline: "asc" },
      include: {
        module: { select: { code: true, name: true } },
        submissions: {
          where: { studentId: session.studentId },
          select: { id: true, submittedAt: true, isLate: true, originalFileName: true },
        },
      },
    })
    const enrolled = student.enrolmentStatus === "ENROLLED"
    const now = new Date()
    return (
      <>
        <PageHeader
          title="Assessments"
          description="Upload one PDF or DOCX for each assessment. You can replace it until the deadline. A first file handed in after the deadline is kept and marked late."
        />
        {enrolled ? null : (
          <p className="mb-4 text-sm text-muted-foreground">
            Only enrolled students can submit work. You can still see what you have already handed in.
          </p>
        )}
        <DataTable
          rows={assessments}
          rowKey={(assessment) => assessment.id}
          empty="Your programme has no assessments yet."
          columns={[
            { key: "assessment", header: "Assessment", cell: (assessment) => assessment.title },
            { key: "module", header: "Module", cell: (assessment) => assessment.module.code },
            {
              key: "deadline",
              header: "Deadline (UTC)",
              cell: (assessment) => {
                const closed = now > assessment.deadline
                return (
                  <>
                    {formatDisplayDate(assessment.deadline)} {assessment.deadline.toISOString().slice(11, 16)}
                    {closed ? <Badge variant="outline" className="ml-2">Closed</Badge> : null}
                  </>
                )
              },
            },
            {
              key: "submission",
              header: "Your submission",
              className: "whitespace-normal",
              cell: (assessment) => {
                const submission = assessment.submissions[0]
                const closed = now > assessment.deadline
                return (
                  <>
                    {submission ? (
                      <span className="inline-flex flex-wrap items-center justify-center gap-2">
                        <a href={`/api/submissions/${submission.id}`} className="underline-offset-4 hover:underline">
                          {submission.originalFileName}
                        </a>
                        {submission.isLate ? <Badge variant="destructive">Late</Badge> : <Badge variant="secondary">On time</Badge>}
                      </span>
                    ) : (
                      "Not submitted"
                    )}
                    {enrolled && (!submission || !closed) ? (
                      <div className="mt-2">
                        <RecordModal
                          title={submission ? "Replace file" : "Upload submission"}
                          trigger={submission ? "Replace file" : "Upload"}
                          appearance="edit"
                        >
                          <SubmissionForm
                            assessmentId={assessment.id}
                            replacing={Boolean(submission)}
                            late={closed && !submission}
                          />
                        </RecordModal>
                      </div>
                    ) : null}
                  </>
                )
              },
            },
          ]}
        />
      </>
    )
  }

  const [modules, assessments, submissions] = await Promise.all([
    prisma.module.findMany({
      orderBy: { code: "asc" },
      include: { programme: { select: { name: true } } },
    }),
    prisma.assessment.findMany({
      orderBy: { deadline: "asc" },
      include: { module: { select: { code: true, name: true } }, _count: { select: { submissions: true } } },
    }),
    prisma.submission.findMany({
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { fullName: true, studentNumber: true } },
        assessment: { select: { title: true } },
      },
    }),
  ])
  const moduleOptions = modules.map((module) => ({
    id: module.id,
    label: `${module.code} — ${module.name} (${module.programme.name})`,
  }))

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Create an assessment against a module. A past deadline can be saved; work handed in after it is marked late."
        action={
          modules.length > 0 ? (
            <RecordModal title="Add assessment" trigger="Add assessment">
              <AssessmentForm modules={moduleOptions} />
            </RecordModal>
          ) : null
        }
      />
      <Notice message={params.error} />
      {modules.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">Add a module before creating an assessment.</p>
      ) : null}
      <DataTable
        rows={assessments}
        rowKey={(assessment) => assessment.id}
        empty="No assessments yet."
        columns={[
          { key: "title", header: "Title", cell: (assessment) => assessment.title },
          { key: "module", header: "Module", cell: (assessment) => assessment.module.code },
          { key: "deadline", header: "Deadline (UTC)", cell: (assessment) => toDateTimeInput(assessment.deadline).replace("T", " ") },
          { key: "submissions", header: "Submissions", cell: (assessment) => assessment._count.submissions },
          {
            key: "actions",
            header: "",
            cell: (assessment) => (
              <RowActions
                id={assessment.id}
                label={assessment.title}
                action={deleteAssessment}
                edit={
                  <RecordModal title="Edit assessment" trigger="Edit" appearance="edit">
                    <AssessmentForm
                      modules={moduleOptions}
                      assessment={{
                        id: assessment.id,
                        title: assessment.title,
                        moduleId: assessment.moduleId,
                        deadline: toDateTimeInput(assessment.deadline),
                      }}
                    />
                  </RecordModal>
                }
              />
            ),
          },
        ]}
      />
      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">Submissions</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Open a file to read it in a new tab. A PDF opens in the browser, and a Word document opens as text. The file name downloads the original.
      </p>
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
    </>
  )
}
