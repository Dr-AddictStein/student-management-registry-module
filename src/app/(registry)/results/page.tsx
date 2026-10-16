import Link from "next/link"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { ResultForm } from "@/components/registry-forms"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CLASSIFICATION_LABELS } from "@/lib/domain"
import { prisma } from "@/lib/prisma"
import { deleteResult } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { EmptyRow, Notice, RecordTable, RowActions } from "@/components/record-list"

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
        <RecordTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Classification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <EmptyRow span={4} message="No published results yet." />
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.assessment.title}</TableCell>
                    <TableCell>{result.assessment.module.code}</TableCell>
                    <TableCell>{result.grade}</TableCell>
                    <TableCell>{CLASSIFICATION_LABELS[result.classification]}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </RecordTable>
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
      <RecordTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Published</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <EmptyRow span={6} message="No grades yet." />
            ) : (
              results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.student.studentNumber} {result.student.fullName}</TableCell>
                  <TableCell>{result.assessment.title}</TableCell>
                  <TableCell>{result.grade}</TableCell>
                  <TableCell>{CLASSIFICATION_LABELS[result.classification]}</TableCell>
                  <TableCell>
                    {result.published ? <Badge>Published</Badge> : <Badge variant="outline">Withheld</Badge>}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      editHref={`/results?edit=${result.id}`}
                      id={result.id}
                      label="this grade"
                      action={deleteResult}
                    />
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
