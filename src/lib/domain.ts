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

export function formatStudentNumber(year: number, sequence: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error("Student number year must be a four-digit year.")
  }

  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999) {
    throw new Error("Student number sequence must be between 1 and 9999.")
  }

  return `SMS-${year}-${sequence.toString().padStart(4, "0")}`
}
