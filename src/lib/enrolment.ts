import {
  feeDueFrom,
  formatAcademicYear,
  formatStudentNumber,
  parseAcademicYear,
  type EnrolmentStatus,
} from "@/lib/domain"
import { prisma } from "@/lib/prisma"

export class EnrolmentError extends Error {}

type NewStudent = {
  fullName: string
  email: string
  passwordHash: string
  dateOfBirth: Date
  academicYear: string
  programmeId: string
  enrolmentStatus?: EnrolmentStatus
  feeDueDate?: Date
}

export async function createStudent(input: NewStudent) {
  const startYear = parseAcademicYear(input.academicYear)
  if (!startYear) {
    throw new EnrolmentError("Enter the academic year as 2025/26.")
  }

  const academicYear = formatAcademicYear(startYear)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const programme = await tx.programme.findUnique({
          where: { id: input.programmeId },
        })
        if (!programme) {
          throw new EnrolmentError("Choose a programme from the list.")
        }

        const prefix = `SMS-${startYear}-`
        const latest = await tx.student.findFirst({
          where: { studentNumber: { startsWith: prefix } },
          orderBy: { studentNumber: "desc" },
          select: { studentNumber: true },
        })
        const sequence = latest ? Number(latest.studentNumber.slice(-4)) + 1 : 1

        return tx.student.create({
          data: {
            studentNumber: formatStudentNumber(startYear, sequence),
            fullName: input.fullName,
            email: input.email,
            passwordHash: input.passwordHash,
            dateOfBirth: input.dateOfBirth,
            academicYear,
            enrolmentStatus: input.enrolmentStatus ?? "ENROLLED",
            assignedFee: programme.feeAmount,
            feeDueDate: input.feeDueDate ?? feeDueFrom(),
            programmeId: programme.id,
          },
          include: { programme: true },
        })
      })
    } catch (error) {
      if (error instanceof EnrolmentError) throw error
      const target = uniqueTarget(error)
      if (target?.includes("email")) {
        throw new EnrolmentError("An account with that email already exists.")
      }
      if (target?.includes("studentNumber") && attempt === 0) continue
      throw error
    }
  }

  throw new EnrolmentError("The student ID could not be issued. Try again.")
}

function uniqueTarget(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002" &&
    "meta" in error
  ) {
    const target = (error as { meta?: { target?: unknown } }).meta?.target
    if (Array.isArray(target)) return target.map(String)
    if (typeof target === "string") return [target]
  }
  return null
}
