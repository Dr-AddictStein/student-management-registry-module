import Link from "next/link"
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
import { Notice, RowActions } from "@/components/record-list"

export default function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>
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
  searchParams: Promise<{ edit?: string; error?: string }>
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
                      <SubmissionForm assessmentId={assessment.id} replacing={Boolean(submission)} late={closed && !submission} />
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
  const editing = assessments.find((assessment) => assessment.id === params.edit)

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Create an assessment against a module. A past deadline can be saved; work handed in after it is marked late."
      />
      <Notice message={params.error} />
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add a module before creating an assessment.</p>
      ) : (
        <section className="mb-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <AssessmentForm
            modules={modules.map((module) => ({
              id: module.id,
              label: `${module.code} — ${module.name} (${module.programme.name})`,
            }))}
            assessment={
              editing
                ? {
                    id: editing.id,
                    title: editing.title,
                    moduleId: editing.moduleId,
                    deadline: toDateTimeInput(editing.deadline),
                  }
                : undefined
            }
          />
          {editing ? (
            <Link href="/assessments" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
              Cancel editing
            </Link>
          ) : null}
        </section>
      )}
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
                editHref={`/assessments?edit=${assessment.id}`}
                id={assessment.id}
                label={assessment.title}
                action={deleteAssessment}
              />
            ),
          },
        ]}
      />
      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">Submissions</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Students upload their own files. A submission can be removed here so the assessment can be deleted.
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
            cell: (submission) => (
              <>
                <a href={`/api/submissions/${submission.id}`} className="underline-offset-4 hover:underline">
                  {submission.originalFileName}
                </a>
                {submission.isLate ? <Badge variant="destructive" className="ml-2">Late</Badge> : null}
              </>
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
