import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ConfirmDelete } from "@/components/confirm-delete"
import { PageHeader } from "@/components/page-header"
import { AssessmentForm } from "@/components/registry-forms"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDisplayDate } from "@/lib/domain"
import { toDateTimeInput } from "@/lib/inputs"
import { prisma } from "@/lib/prisma"
import { deleteAssessment, deleteSubmission } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { EmptyRow, Notice, RecordTable, RowActions } from "@/components/record-list"

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
      select: { programmeId: true },
    })
    if (!student) redirect("/api/logout")
    const assessments = await prisma.assessment.findMany({
      where: { module: { programmeId: student.programmeId } },
      orderBy: { deadline: "asc" },
      include: {
        module: { select: { code: true, name: true } },
        submissions: { where: { studentId: session.studentId }, select: { submittedAt: true, isLate: true, originalFileName: true } },
      },
    })
    return (
      <>
        <PageHeader
          title="Assessments"
          description="These are the assessments on your programme. File upload will use the submission row staff can already see."
        />
        <RecordTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Deadline (UTC)</TableHead>
                <TableHead>Your submission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 ? (
                <EmptyRow span={4} message="Your programme has no assessments yet." />
              ) : (
                assessments.map((assessment) => {
                  const submission = assessment.submissions[0]
                  return (
                    <TableRow key={assessment.id}>
                      <TableCell>{assessment.title}</TableCell>
                      <TableCell>{assessment.module.code}</TableCell>
                      <TableCell>{formatDisplayDate(assessment.deadline)} {assessment.deadline.toISOString().slice(11, 16)}</TableCell>
                      <TableCell>
                        {submission ? (
                          <span className="inline-flex items-center gap-2">
                            {submission.originalFileName}
                            {submission.isLate ? <Badge variant="destructive">Late</Badge> : <Badge variant="secondary">On time</Badge>}
                          </span>
                        ) : (
                          "Not submitted"
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </RecordTable>
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
      <RecordTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Deadline (UTC)</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <EmptyRow span={5} message="No assessments yet." />
            ) : (
              assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>{assessment.title}</TableCell>
                  <TableCell>{assessment.module.code}</TableCell>
                  <TableCell>{toDateTimeInput(assessment.deadline).replace("T", " ")}</TableCell>
                  <TableCell>{assessment._count.submissions}</TableCell>
                  <TableCell>
                    <RowActions
                      editHref={`/assessments?edit=${assessment.id}`}
                      id={assessment.id}
                      label={assessment.title}
                      action={deleteAssessment}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </RecordTable>
      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">Submissions</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Students upload their own files. A submission can be removed here so the assessment can be deleted.
      </p>
      <RecordTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Handed in (UTC)</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <EmptyRow span={5} message="No submissions yet." />
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.student.studentNumber} {submission.student.fullName}</TableCell>
                  <TableCell>{submission.assessment.title}</TableCell>
                  <TableCell>
                    {submission.originalFileName}
                    {submission.isLate ? <Badge variant="destructive" className="ml-2">Late</Badge> : null}
                  </TableCell>
                  <TableCell>{toDateTimeInput(submission.submittedAt).replace("T", " ")}</TableCell>
                  <TableCell>
                    <ConfirmDelete action={deleteSubmission} id={submission.id} label={submission.originalFileName} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </RecordTable>
    </>
  )
}
