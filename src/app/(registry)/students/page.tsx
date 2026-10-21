import Link from "next/link"
import { Suspense } from "react"
import { EnrolmentSummary } from "@/components/enrolment-summary"
import { PageHeader } from "@/components/page-header"
import { StudentForm } from "@/components/registry-forms"
import { NativeSelect } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ENROLMENT_STATUSES, ENROLMENT_STATUS_LABELS, feeDueFrom, type EnrolmentStatus } from "@/lib/domain"
import { moneyInput, toDateInput } from "@/lib/inputs"
import { prisma } from "@/lib/prisma"
import { deleteStudent } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { loadStudent } from "@/lib/current-student"
import { DataTable } from "@/components/data-table"
import { RecordModal } from "@/components/record-modal"
import { Notice, RowActions } from "@/components/record-list"

export default function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string; status?: string; programme?: string }>
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
  searchParams: Promise<{ error?: string; q?: string; status?: string; programme?: string }>
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
  return (
    <>
      <PageHeader
        title="Students"
        description="Add a student from the desk, or they can register themselves. The student ID is issued here and cannot be edited."
        action={
          programmes.length > 0 ? (
            <RecordModal title="Add student" trigger="Add student">
              <StudentForm programmes={programmes} defaultDueDate={toDateInput(feeDueFrom())} />
            </RecordModal>
          ) : null
        }
      />
      <Notice message={params.error} />
      <form className="mb-4 flex flex-wrap items-end gap-2" action="/students">
        <Input name="q" defaultValue={params.q} placeholder="Name, email, or student ID" className="w-64" />
        <NativeSelect name="programme" defaultValue={params.programme ?? ""} className="w-auto">
          <option value="">All programmes</option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>{programme.name}</option>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={params.status ?? ""} className="w-auto">
          <option value="">All statuses</option>
          {ENROLMENT_STATUSES.map((item) => (
            <option key={item} value={item}>{ENROLMENT_STATUS_LABELS[item]}</option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">Search</Button>
        <Link href="/students" className="text-sm underline-offset-4 hover:underline">Clear</Link>
      </form>
      {programmes.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">Add a programme before enrolling a student.</p>
      ) : null}
      <DataTable
        rows={students}
        rowKey={(student) => student.id}
        empty="No students match this search."
        columns={[
          { key: "id", header: "Student ID", cell: (student) => student.studentNumber },
          { key: "name", header: "Name", cell: (student) => student.fullName },
          { key: "email", header: "Email", cell: (student) => student.email },
          { key: "programme", header: "Programme", cell: (student) => student.programme.name },
          { key: "year", header: "Year", cell: (student) => student.academicYear },
          { key: "status", header: "Status", cell: (student) => ENROLMENT_STATUS_LABELS[student.enrolmentStatus] },
          {
            key: "actions",
            header: "",
            cell: (student) => (
              <RowActions
                id={student.id}
                label={student.fullName}
                action={deleteStudent}
                edit={
                  <RecordModal title="Edit student" trigger="Edit" appearance="edit">
                    <StudentForm
                      programmes={programmes}
                      student={{
                        id: student.id,
                        fullName: student.fullName,
                        email: student.email,
                        dateOfBirth: toDateInput(student.dateOfBirth),
                        programmeId: student.programmeId,
                        academicYear: student.academicYear,
                        enrolmentStatus: student.enrolmentStatus,
                        assignedFee: moneyInput(student.assignedFee),
                        feeDueDate: toDateInput(student.feeDueDate),
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
