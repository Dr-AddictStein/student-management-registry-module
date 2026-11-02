import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AssessmentSections } from "@/components/assessment-sections"
import { ConfirmDelete } from "@/components/confirm-delete"
import { DataTable } from "@/components/data-table"
import { Field, NativeSelect } from "@/components/form-field"
import { ListPagination } from "@/components/list-pagination"
import { OpenSubmission } from "@/components/open-submission"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toDateTimeInput } from "@/lib/inputs"
import { pageHref, paginate, parsePage } from "@/lib/pagination"
import { prisma } from "@/lib/prisma"
import { deleteSubmission } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"

const PDF_MIME = "application/pdf"
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

type SubmissionQuery = {
  page?: string
  q?: string
  assessment?: string
  programme?: string
  timing?: string
  file?: string
}

export default function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SubmissionQuery>
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
  searchParams: Promise<SubmissionQuery>
}) {
  const session = await requireSession()
  if (session.role !== "staff") redirect("/assessments")

  const params = await searchParams
  const q = (params.q ?? "").trim().slice(0, 120)
  const timing = params.timing === "late" || params.timing === "ontime" ? params.timing : ""
  const file = params.file === "pdf" || params.file === "docx" ? params.file : ""

  const [assessmentOptions, programmeOptions] = await Promise.all([
    prisma.assessment.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, module: { select: { code: true } } },
    }),
    prisma.programme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])
  const assessmentId = assessmentOptions.some((assessment) => assessment.id === params.assessment)
    ? (params.assessment ?? "")
    : ""
  const programmeId = programmeOptions.some((programme) => programme.id === params.programme)
    ? (params.programme ?? "")
    : ""

  const where = submissionWhere({ q, assessmentId, programmeId, timing, file })
  const search = {
    q: q || undefined,
    assessment: assessmentId || undefined,
    programme: programmeId || undefined,
    timing: timing || undefined,
    file: file || undefined,
  }
  const filtering = Object.values(search).some(Boolean)

  const requested = parsePage(params.page)
  const total = await prisma.submission.count({ where })
  const page = paginate(requested, total)
  if (requested !== page.current) redirect(pageHref("/assessments/submissions", page.current, search))

  const submissions = await prisma.submission.findMany({
    where,
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
        description="Search by student or file, then narrow the list. Open a file in a new tab. A PDF opens in the browser, and a Word document opens as text."
      />
      <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" action="/assessments/submissions">
        <Field label="Student or file" className="sm:col-span-2 lg:col-span-3">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Name, email, student ID, assessment, or file name"
          />
        </Field>
        <Field label="Programme">
          <NativeSelect name="programme" defaultValue={programmeId}>
            <option value="">All programmes</option>
            {programmeOptions.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Assessment">
          <NativeSelect name="assessment" defaultValue={assessmentId}>
            <option value="">All assessments</option>
            {assessmentOptions.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.module.code} — {assessment.title}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Timing">
          <NativeSelect name="timing" defaultValue={timing}>
            <option value="">On time and late</option>
            <option value="ontime">On time</option>
            <option value="late">Late</option>
          </NativeSelect>
        </Field>
        <Field label="File type">
          <NativeSelect name="file" defaultValue={file}>
            <option value="">PDF and Word</option>
            <option value="pdf">PDF</option>
            <option value="docx">Word</option>
          </NativeSelect>
        </Field>
        <div className="flex items-end gap-3">
          <Button type="submit" variant="outline">
            Search
          </Button>
          {filtering ? (
            <Link href="/assessments/submissions" className="text-sm underline-offset-4 hover:underline">
              Clear
            </Link>
          ) : null}
        </div>
      </form>
      <DataTable
        rows={submissions}
        rowKey={(submission) => submission.id}
        empty={filtering ? "No submissions match this search." : "No submissions yet."}
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
      <ListPagination pathname="/assessments/submissions" search={search} {...page} />
    </>
  )
}

function submissionWhere({
  q,
  assessmentId,
  programmeId,
  timing,
  file,
}: {
  q: string
  assessmentId: string
  programmeId: string
  timing: "" | "late" | "ontime"
  file: "" | "pdf" | "docx"
}) {
  return {
    ...(q
      ? {
          OR: [
            { originalFileName: { contains: q, mode: "insensitive" as const } },
            { student: { fullName: { contains: q, mode: "insensitive" as const } } },
            { student: { email: { contains: q, mode: "insensitive" as const } } },
            { student: { studentNumber: { contains: q, mode: "insensitive" as const } } },
            { assessment: { title: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(assessmentId ? { assessmentId } : {}),
    ...(programmeId ? { student: { programmeId } } : {}),
    ...(timing === "late" ? { isLate: true } : timing === "ontime" ? { isLate: false } : {}),
    ...(file === "pdf" ? { mimeType: PDF_MIME } : file === "docx" ? { mimeType: DOCX_MIME } : {}),
  }
}
