export const ENROLMENT_STATUSES = [
  "ENROLLED",
  "DEFERRED",
  "WITHDRAWN",
  "COMPLETED",
] as const

export type EnrolmentStatus = (typeof ENROLMENT_STATUSES)[number]

export const ENROLMENT_STATUS_LABELS: Record<EnrolmentStatus, string> = {
  ENROLLED: "Enrolled",
  DEFERRED: "Deferred",
  WITHDRAWN: "Withdrawn",
  COMPLETED: "Completed",
}

export const CLASSIFICATIONS = ["FAIL", "PASS", "MERIT", "DISTINCTION"] as const

export type Classification = (typeof CLASSIFICATIONS)[number]

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  FAIL: "Fail",
  PASS: "Pass",
  MERIT: "Merit",
  DISTINCTION: "Distinction",
}

export function classifyGrade(grade: number): Classification {
  if (!Number.isInteger(grade) || grade < 0 || grade > 100) {
    throw new Error("Grade must be an integer from 0 to 100.")
  }

  if (grade >= 70) return "DISTINCTION"
  if (grade >= 60) return "MERIT"
  if (grade >= 40) return "PASS"
  return "FAIL"
}

const ACADEMIC_YEAR = /^(\d{4})\/(\d{2})$/

export function parseAcademicYear(value: string) {
  const match = value.trim().match(ACADEMIC_YEAR)
  if (!match) return null

  const start = Number(match[1])
  const end = Number(match[2])
  if (start < 2000 || start > 9999) return null
  if (end !== (start + 1) % 100) return null

  return start
}

export function formatAcademicYear(startYear: number) {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`
}

const MINIMUM_STUDENT_AGE = 16

export function parseDateOfBirth(value: string, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  if (date.toISOString().slice(0, 10) !== value) return null

  const oldest = new Date(Date.UTC(today.getUTCFullYear() - 100, today.getUTCMonth(), today.getUTCDate()))
  const youngest = new Date(
    Date.UTC(today.getUTCFullYear() - MINIMUM_STUDENT_AGE, today.getUTCMonth(), today.getUTCDate()),
  )

  if (date < oldest || date > youngest) return null
  return date
}

export const FEE_DUE_DAYS = 30

export function feeDueFrom(today = new Date()) {
  const due = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  due.setUTCDate(due.getUTCDate() + FEE_DUE_DAYS)
  return due
}

export function formatAmount(amount: { toString(): string } | number | string) {
  const value = typeof amount === "number" ? amount : Number(amount.toString())
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function formatStudentNumber(year: number, sequence: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error("Student number year must be a four-digit year.")
  }

  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999) {
    throw new Error("Student number sequence must be between 1 and 9999.")
  }

  return `SMS-${year}-${sequence.toString().padStart(4, "0")}`
}
