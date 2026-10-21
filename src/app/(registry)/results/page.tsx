import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { RecordModal } from "@/components/record-modal"
import { ResultForm } from "@/components/registry-forms"
import { Badge } from "@/components/ui/badge"
import { CLASSIFICATION_LABELS } from "@/lib/domain"
import { prisma } from "@/lib/prisma"
import { deleteResult } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { DataTable } from "@/components/data-table"
import { Notice, RowActions } from "@/components/record-list"

export default function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading results…</p>}>
      <ResultsContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ResultsContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireSession()
  const params = await searchParams

  if (session.role === "student") {
    const results = await prisma.result.findMany({
      where: { studentId: session.studentId, published: true },
      orderBy: { assessment: { deadline: "asc" } },
      include: { assessment: { include: { module: { select: { code: true, name: true } } } } },
    })
    return (
      <>
        <PageHeader
          title="My results"
          description="Only grades the registry has published are listed. Withheld results are not shown."
        />
        <DataTable
          rows={results}
          rowKey={(result) => result.id}
          empty="No published results yet."
          columns={[
            { key: "assessment", header: "Assessment", cell: (result) => result.assessment.title },
            { key: "module", header: "Module", cell: (result) => result.assessment.module.code },
            { key: "grade", header: "Grade", cell: (result) => result.grade },
            { key: "classification", header: "Classification", cell: (result) => CLASSIFICATION_LABELS[result.classification] },
          ]}
        />
      </>
    )
  }

  const [students, assessments, results] = await Promise.all([
    prisma.student.findMany({
      orderBy: { studentNumber: "asc" },
      select: { id: true, fullName: true, studentNumber: true },
    }),
    prisma.assessment.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, module: { select: { code: true } } },
    }),
    prisma.result.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        student: { select: { fullName: true, studentNumber: true } },
        assessment: { select: { title: true } },
      },
    }),
  ])
  const studentOptions = students.map((student) => ({
    id: student.id,
    label: `${student.studentNumber} — ${student.fullName}`,
  }))
  const assessmentOptions = assessments.map((assessment) => ({
    id: assessment.id,
    label: `${assessment.module.code} — ${assessment.title}`,
  }))
  const canGrade = students.length > 0 && assessments.length > 0

  return (
    <>
      <PageHeader
        title="Marksheet and results"
        description="Enter one grade from 0 to 100. Pass is 40, Merit is 60, and Distinction is 70. The student sees the grade only when it is published."
        action={
          canGrade ? (
            <RecordModal title="Add grade" trigger="Add grade">
              <ResultForm students={studentOptions} assessments={assessmentOptions} />
            </RecordModal>
          ) : null
        }
      />
      <Notice message={params.error} />
      {canGrade ? null : (
        <p className="mb-6 text-sm text-muted-foreground">Add a student and an assessment before entering a grade.</p>
      )}
      <DataTable
        rows={results}
        rowKey={(result) => result.id}
        empty="No grades yet."
        columns={[
          { key: "student", header: "Student", cell: (result) => `${result.student.studentNumber} ${result.student.fullName}` },
          { key: "assessment", header: "Assessment", cell: (result) => result.assessment.title },
          { key: "grade", header: "Grade", cell: (result) => result.grade },
          { key: "classification", header: "Classification", cell: (result) => CLASSIFICATION_LABELS[result.classification] },
          {
            key: "published",
            header: "Published",
            cell: (result) => (result.published ? <Badge>Published</Badge> : <Badge variant="outline">Withheld</Badge>),
          },
          {
            key: "actions",
            header: "",
            cell: (result) => (
              <RowActions
                id={result.id}
                label="this grade"
                action={deleteResult}
                edit={
                  <RecordModal title="Edit grade" trigger="Edit" appearance="edit">
                    <ResultForm
                      students={studentOptions}
                      assessments={assessmentOptions}
                      result={{
                        id: result.id,
                        studentId: result.studentId,
                        assessmentId: result.assessmentId,
                        grade: result.grade,
                        published: result.published,
                      }}
                    />
                  </RecordModal>
                }
              />
            ),
          },
        ]}
      />
    </>
  )
}
