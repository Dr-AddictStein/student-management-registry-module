import Link from "next/link"
import { Suspense } from "react"
import { EnrolmentSummary } from "@/components/enrolment-summary"
import { PageHeader } from "@/components/page-header"
import { StudentForm } from "@/components/registry-forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ENROLMENT_STATUSES, ENROLMENT_STATUS_LABELS, feeDueFrom, type EnrolmentStatus } from "@/lib/domain"
import { moneyInput, toDateInput } from "@/lib/inputs"
import { prisma } from "@/lib/prisma"
import { deleteStudent } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { loadStudent } from "@/lib/current-student"
import { EmptyRow, Notice, RecordTable, RowActions } from "@/components/record-list"

export default function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; q?: string; status?: string; programme?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading students…</p>}>
      <StudentsContent searchParams={searchParams} />
    </Suspense>
  )
}

async function StudentsContent({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; q?: string; status?: string; programme?: string }>
}) {
  const session = await requireSession()
  if (session.role === "student") {
    const student = await loadStudent(session.studentId)
    return (
      <>
        <PageHeader
          title="My enrolment"
          description="The registry issued this student ID. Staff can change your status, programme, and fee."
        />
        <EnrolmentSummary student={student} />
      </>
    )
  }

  const params = await searchParams
  const status = ENROLMENT_STATUSES.includes(params.status as EnrolmentStatus)
    ? (params.status as EnrolmentStatus)
    : undefined
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  const students = await prisma.student.findMany({
    where: {
      ...(params.q
        ? {
            OR: [
              { fullName: { contains: params.q, mode: "insensitive" } },
              { studentNumber: { contains: params.q, mode: "insensitive" } },
              { email: { contains: params.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status ? { enrolmentStatus: status } : {}),
      ...(params.programme ? { programmeId: params.programme } : {}),
    },
    orderBy: { studentNumber: "asc" },
    include: { programme: { select: { name: true } } },
  })
  const editing = params.edit ? students.find((student) => student.id === params.edit) ?? await prisma.student.findUnique({ where: { id: params.edit } }) : null

  return (
    <>
      <PageHeader
        title="Students"
        description="Add a student from the desk, or they can register themselves. The student ID is issued here and cannot be edited."
      />
      <Notice message={params.error} />
      <form className="mb-4 flex flex-wrap items-end gap-2" action="/students">
        <Input name="q" defaultValue={params.q} placeholder="Name, email, or student ID" className="w-64" />
        <select name="programme" defaultValue={params.programme ?? ""} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">All programmes</option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>{programme.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">All statuses</option>
          {ENROLMENT_STATUSES.map((item) => (
            <option key={item} value={item}>{ENROLMENT_STATUS_LABELS[item]}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Search</Button>
        <Link href="/students" className="text-sm underline-offset-4 hover:underline">Clear</Link>
      </form>
      {programmes.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">Add a programme before enrolling a student.</p>
      ) : (
        <section className="mb-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <StudentForm
            programmes={programmes}
            defaultDueDate={toDateInput(feeDueFrom())}
            student={
              editing
                ? {
                    id: editing.id,
                    fullName: editing.fullName,
                    email: editing.email,
                    dateOfBirth: toDateInput(editing.dateOfBirth),
                    programmeId: editing.programmeId,
                    academicYear: editing.academicYear,
                    enrolmentStatus: editing.enrolmentStatus,
                    assignedFee: moneyInput(editing.assignedFee),
                    feeDueDate: toDateInput(editing.feeDueDate),
                  }
                : undefined
            }
          />
          {editing ? (
            <Link href="/students" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
              Cancel editing
            </Link>
          ) : null}
        </section>
      )}
      <RecordTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <EmptyRow span={7} message="No students match this search." />
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.studentNumber}</TableCell>
                  <TableCell>{student.fullName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.programme.name}</TableCell>
                  <TableCell>{student.academicYear}</TableCell>
                  <TableCell>{ENROLMENT_STATUS_LABELS[student.enrolmentStatus]}</TableCell>
                  <TableCell>
                    <RowActions
                      editHref={`/students?edit=${student.id}`}
                      id={student.id}
                      label={student.fullName}
                      action={deleteStudent}
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
