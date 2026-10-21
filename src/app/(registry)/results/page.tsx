import Link from "next/link"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
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
  searchParams: Promise<{ edit?: string; error?: string }>
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
  searchParams: Promise<{ edit?: string; error?: string }>
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
  const editing = results.find((result) => result.id === params.edit)

  return (
    <>
      <PageHeader
        title="Marksheet and results"
        description="Enter one grade from 0 to 100. Pass is 40, Merit is 60, and Distinction is 70. The student sees the grade only when it is published."
      />
      <Notice message={params.error} />
      {students.length === 0 || assessments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add a student and an assessment before entering a grade.</p>
      ) : (
        <section className="mb-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <ResultForm
            students={students.map((student) => ({
              id: student.id,
              label: `${student.studentNumber} — ${student.fullName}`,
            }))}
            assessments={assessments.map((assessment) => ({
              id: assessment.id,
              label: `${assessment.module.code} — ${assessment.title}`,
            }))}
            result={
              editing
                ? {
                    id: editing.id,
                    studentId: editing.studentId,
                    assessmentId: editing.assessmentId,
                    grade: editing.grade,
                    published: editing.published,
                  }
                : undefined
            }
          />
          {editing ? (
            <Link href="/results" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
              Cancel editing
            </Link>
          ) : null}
        </section>
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
                editHref={`/results?edit=${result.id}`}
                id={result.id}
                label="this grade"
                action={deleteResult}
              />
            ),
          },
        ]}
      />
    </>
  )
}
