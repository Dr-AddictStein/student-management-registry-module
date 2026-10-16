import {
  ENROLMENT_STATUS_LABELS,
  formatAmount,
  formatDisplayDate,
  type EnrolmentStatus,
} from "@/lib/domain"

type EnrolmentRecord = {
  studentNumber: string
  fullName: string
  email: string
  dateOfBirth: Date
  academicYear: string
  enrolmentStatus: EnrolmentStatus
  assignedFee: { toString(): string }
  feeDueDate: Date
  programme: { name: string; code: string }
}

export function EnrolmentSummary({ student }: { student: EnrolmentRecord }) {
  const rows = [
    ["Student ID", student.studentNumber],
    ["Name", student.fullName],
    ["Email", student.email],
    ["Date of birth", formatDisplayDate(student.dateOfBirth)],
    ["Programme", `${student.programme.name} (${student.programme.code})`],
    ["Academic year", student.academicYear],
    ["Status", ENROLMENT_STATUS_LABELS[student.enrolmentStatus]],
    ["Assigned fee", formatAmount(student.assignedFee)],
    ["Fee due", formatDisplayDate(student.feeDueDate)],
  ]

  return (
    <dl className="grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-foreground/10 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="bg-card px-4 py-3 last:sm:col-span-2">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
