"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  ENROLMENT_STATUSES,
  classifyGrade,
  parseAcademicYear,
  parseDateOfBirth,
  formatAcademicYear,
  type EnrolmentStatus,
} from "@/lib/domain"
import { EnrolmentError, createStudent } from "@/lib/enrolment"
import { removeStoredFile } from "@/lib/files"
import { outstandingBalance, sumPayments } from "@/lib/fees"
import { parseMoney, parseUtcDate, parseUtcDateTime, todayUtcDate } from "@/lib/inputs"
import { hashPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"
import { staffError } from "@/lib/staff"

export type FormState = { error: string } | null

const PASSWORD_MIN = 8

function refresh(paths: string[]) {
  for (const path of paths) revalidatePath(path)
}

export async function saveProgramme(_state: FormState, formData: FormData): Promise<FormState> {
  const denied = await staffError()
  if (denied) return { error: denied }

  const id = String(formData.get("id") ?? "")
  const code = String(formData.get("code") ?? "").trim().toUpperCase()
  const name = String(formData.get("name") ?? "").trim()
  const feeAmount = parseMoney(String(formData.get("feeAmount") ?? ""))

  if (!/^[A-Z0-9-]{2,20}$/.test(code)) return { error: "Use a programme code of 2–20 letters, numbers, or hyphens." }
  if (name.length < 2 || name.length > 120) return { error: "Enter the programme name." }
  if (feeAmount === null) return { error: "Enter the fee as a number with up to two decimal places." }

  try {
    if (id) {
      await prisma.programme.update({ where: { id }, data: { code, name, feeAmount } })
    } else {
      await prisma.programme.create({ data: { code, name, feeAmount } })
    }
  } catch (error) {
    if (uniqueTarget(error)?.some((item) => item.includes("code"))) {
      return { error: "That programme code is already in use." }
    }
    throw error
  }

  refresh(["/programmes", "/modules", "/students", "/register"])
  redirect("/programmes")
}

export async function deleteProgramme(formData: FormData) {
  const denied = await staffError()
  if (denied) redirect("/programmes")

  const id = String(formData.get("id") ?? "")
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: { _count: { select: { modules: true, students: true } } },
  })
  if (!programme) redirect("/programmes")
  if (programme._count.modules > 0 || programme._count.students > 0) {
    redirect("/programmes?error=Remove+its+modules+and+students+before+deleting+this+programme.")
  }

  await prisma.programme.delete({ where: { id } })
  refresh(["/programmes", "/register"])
  redirect("/programmes")
}

export async function saveModule(_state: FormState, formData: FormData): Promise<FormState> {
  const denied = await staffError()
  if (denied) return { error: denied }

  const id = String(formData.get("id") ?? "")
  const programmeId = String(formData.get("programmeId") ?? "")
  const code = String(formData.get("code") ?? "").trim().toUpperCase()
  const name = String(formData.get("name") ?? "").trim()

  if (!programmeId) return { error: "Choose a programme." }
  if (!/^[A-Z0-9-]{2,20}$/.test(code)) return { error: "Use a module code of 2–20 letters, numbers, or hyphens." }
  if (name.length < 2 || name.length > 120) return { error: "Enter the module name." }

  const programme = await prisma.programme.findUnique({ where: { id: programmeId } })
  if (!programme) return { error: "Choose a programme from the list." }

  try {
    if (id) {
      await prisma.module.update({ where: { id }, data: { programmeId, code, name } })
    } else {
      await prisma.module.create({ data: { programmeId, code, name } })
    }
  } catch (error) {
    if (uniqueTarget(error)) return { error: "That module code is already used on this programme." }
    throw error
  }

  refresh(["/modules", "/assessments"])
  redirect("/modules")
}

export async function deleteModule(formData: FormData) {
  const denied = await staffError()
  if (denied) redirect("/modules")

  const id = String(formData.get("id") ?? "")
  const courseModule = await prisma.module.findUnique({
    where: { id },
    include: { _count: { select: { assessments: true } } },
  })
  if (!courseModule) redirect("/modules")
  if (courseModule._count.assessments > 0) {
    redirect("/modules?error=Remove+its+assessments+before+deleting+this+module.")
  }

  await prisma.module.delete({ where: { id } })
  refresh(["/modules"])
  redirect("/modules")
}

export async function saveStudent(_state: FormState, formData: FormData): Promise<FormState> {
  const denied = await staffError()
  if (denied) return { error: denied }

  const id = String(formData.get("id") ?? "")
  const fullName = String(formData.get("fullName") ?? "").trim().replace(/\s+/g, " ")
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")
  const dateOfBirth = parseDateOfBirth(String(formData.get("dateOfBirth") ?? ""))
  const academicYear = String(formData.get("academicYear") ?? "").trim()
  const programmeId = String(formData.get("programmeId") ?? "")
  const status = String(formData.get("enrolmentStatus") ?? "")
  const assignedFee = parseMoney(String(formData.get("assignedFee") ?? ""))
  const feeDueDate = parseUtcDate(String(formData.get("feeDueDate") ?? ""))
  const staffEmail = process.env.STAFF_EMAIL?.trim().toLowerCase()

  if (fullName.length < 2 || fullName.length > 120) return { error: "Enter the student's full name." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." }
  if (email === staffEmail) return { error: "That email is reserved for the registry desk." }
  if (!dateOfBirth) return { error: "Enter a date of birth. The student must be at least 16." }
  if (!parseAcademicYear(academicYear)) return { error: "Enter the academic year as 2025/26." }
  if (!programmeId) return { error: "Choose a programme." }
  if (!ENROLMENT_STATUSES.includes(status as EnrolmentStatus)) return { error: "Choose an enrolment status." }
  if (!feeDueDate) return { error: "Enter the fee due date." }

  const enrolmentStatus = status as EnrolmentStatus

  if (!id) {
    if (password.length < PASSWORD_MIN) return { error: `Set a password of at least ${PASSWORD_MIN} characters.` }
    if (password !== confirmPassword) return { error: "The passwords do not match." }
    try {
      await createStudent({
        fullName,
        email,
        passwordHash: await hashPassword(password),
        dateOfBirth,
        academicYear,
        programmeId,
        enrolmentStatus,
        feeDueDate,
      })
    } catch (error) {
      if (error instanceof EnrolmentError) return { error: error.message }
      throw error
    }
    refresh(["/students", "/fees", "/results", "/"])
    redirect("/students")
  }

  if (password || confirmPassword) {
    if (password.length < PASSWORD_MIN) return { error: `Use a password of at least ${PASSWORD_MIN} characters.` }
    if (password !== confirmPassword) return { error: "The passwords do not match." }
  }
  if (assignedFee === null) return { error: "Enter the assigned fee with up to two decimal places." }

  const current = await prisma.student.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true, results: true } } },
  })
  if (!current) return { error: "That student is no longer on the register." }
  if (
    current.programmeId !== programmeId &&
    (current._count.submissions > 0 || current._count.results > 0)
  ) {
    return { error: "Remove this student's submissions and grades before changing programme." }
  }

  try {
    await prisma.student.update({
      where: { id },
      data: {
        fullName,
        email,
        dateOfBirth,
        academicYear: formatAcademicYear(parseAcademicYear(academicYear) ?? 0),
        programmeId,
        enrolmentStatus,
        assignedFee,
        feeDueDate,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    })
  } catch (error) {
    if (uniqueTarget(error)?.some((item) => item.includes("email"))) {
      return { error: "An account with that email already exists." }
    }
    throw error
  }

  refresh(["/students", "/fees", "/results", "/"])
  redirect("/students")
}

export async function deleteStudent(formData: FormData) {
  const denied = await staffError()
  if (denied) redirect("/students")

  const id = String(formData.get("id") ?? "")
  const student = await prisma.student.findUnique({
    where: { id },
    include: { _count: { select: { payments: true, submissions: true, results: true } } },
  })
  if (!student) redirect("/students")
  if (student._count.payments || student._count.submissions || student._count.results) {
    redirect("/students?error=Remove+this+student's+payments,+submissions,+and+grades+before+deleting+the+record.")
  }

  await prisma.student.delete({ where: { id } })
  refresh(["/students", "/fees", "/"])
  redirect("/students")
}

export async function saveAssessment(_state: FormState, formData: FormData): Promise<FormState> {
  const denied = await staffError()
  if (denied) return { error: denied }

  const id = String(formData.get("id") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const moduleId = String(formData.get("moduleId") ?? "")
  const deadline = parseUtcDateTime(String(formData.get("deadline") ?? ""))

  if (title.length < 2 || title.length > 160) return { error: "Enter the assessment title." }
  if (!moduleId) return { error: "Choose a module." }
  if (!deadline) return { error: "Enter a deadline." }

  const courseModule = await prisma.module.findUnique({ where: { id: moduleId } })
  if (!courseModule) return { error: "Choose a module from the list." }

  if (id) {
    await prisma.assessment.update({ where: { id }, data: { title, moduleId, deadline } })
    const submissions = await prisma.submission.findMany({
      where: { assessmentId: id },
      select: { id: true, submittedAt: true },
    })
    await Promise.all(
      submissions.map((submission) =>
        prisma.submission.update({
          where: { id: submission.id },
          data: { isLate: submission.submittedAt > deadline },
        }),
      ),
    )
  } else {
    await prisma.assessment.create({ data: { title, moduleId, deadline } })
  }

  refresh(["/assessments", "/results"])
  redirect("/assessments")
}

export async function deleteAssessment(formData: FormData) {
  const denied = await staffError()
  if (denied) redirect("/assessments")

  const id = String(formData.get("id") ?? "")
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true, results: true } } },
  })
  if (!assessment) redirect("/assessments")
  if (assessment._count.submissions || assessment._count.results) {
    redirect("/assessments?error=Remove+submissions+and+grades+before+deleting+this+assessment.")
  }

  await prisma.assessment.delete({ where: { id } })
  refresh(["/assessments"])
  redirect("/assessments")
}

export async function savePayment(_state: FormState, formData: FormData): Promise<FormState> {
  const denied = await staffError()
  if (denied) return { error: denied }

  const id = String(formData.get("id") ?? "")
  const studentId = String(formData.get("studentId") ?? "")
  const amount = parseMoney(String(formData.get("amount") ?? ""))
  const paidOn = parseUtcDate(String(formData.get("paidOn") ?? ""))
  const reference = String(formData.get("reference") ?? "").trim()

  if (!studentId) return { error: "Choose a student." }
  if (amount === null || Number(amount) <= 0) return { error: "Enter a payment amount greater than zero." }
  if (!paidOn) return { error: "Enter the payment date." }
  if (paidOn > todayUtcDate()) return { error: "A payment date cannot be in the future." }
  if (!/^[A-Za-z0-9-]{3,40}$/.test(reference)) {
    return { error: "Enter a reference of 3–40 letters, numbers, or hyphens." }
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { payments: { select: { id: true, amount: true } } },
  })
  if (!student) return { error: "Choose a student from the register." }

  const otherPaid = sumPayments(student.payments.filter((payment) => payment.id !== id))
  const room = outstandingBalance(student.assignedFee, otherPaid)
  if (Number(amount) - room > 0.001) {
    return { error: `This payment is larger than the outstanding balance of ${room.toFixed(2)}.` }
  }

  try {
    if (id) {
      await prisma.payment.update({
        where: { id },
        data: { studentId, amount, paidOn, reference },
      })
    } else {
      await prisma.payment.create({ data: { studentId, amount, paidOn, reference } })
    }
  } catch (error) {
    if (uniqueTarget(error)?.some((item) => item.includes("reference"))) {
      return { error: "That reference has already been recorded." }
    }
    throw error
  }

  refresh(["/fees", "/"])
  redirect("/fees")
}

export async function deletePayment(formData: FormData) {
  const denied = await staffError()
  if (denied) redirect("/fees")

  const id = String(formData.get("id") ?? "")
  await prisma.payment.delete({ where: { id } }).catch(() => null)
  refresh(["/fees", "/"])
  redirect("/fees")
}

export async function saveResult(_state: FormState, formData: FormData): Promise<FormState> {
  const denied = await staffError()
  if (denied) return { error: denied }

  const id = String(formData.get("id") ?? "")
  const studentId = String(formData.get("studentId") ?? "")
  const assessmentId = String(formData.get("assessmentId") ?? "")
  const grade = Number(String(formData.get("grade") ?? ""))
  const published = formData.get("published") === "on"

  if (!studentId || !assessmentId) return { error: "Choose a student and an assessment." }
  if (!Number.isInteger(grade) || grade < 0 || grade > 100) {
    return { error: "Enter a whole-number grade from 0 to 100." }
  }

  const [student, assessment] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { programmeId: true } }),
    prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { module: { select: { programmeId: true } } },
    }),
  ])
  if (!student || !assessment) return { error: "Choose a student and an assessment from the lists." }
  if (student.programmeId !== assessment.module.programmeId) {
    return { error: "That assessment belongs to a different programme." }
  }

  const data = {
    grade,
    classification: classifyGrade(grade),
    published,
    publishedAt: published ? new Date() : null,
  }

  try {
    if (id) {
      await prisma.result.update({ where: { id }, data: { studentId, assessmentId, ...data } })
    } else {
      await prisma.result.create({ data: { studentId, assessmentId, ...data } })
    }
  } catch (error) {
    if (uniqueTarget(error)) return { error: "This student already has a grade for that assessment. Edit the existing row." }
    throw error
  }

  refresh(["/results"])
  redirect("/results")
}

export async function deleteSubmission(formData: FormData) {
  const denied = await staffError()
  if (denied) redirect("/assessments")

  const id = String(formData.get("id") ?? "")
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { storedFileName: true },
  })
  if (submission) {
    await prisma.submission.delete({ where: { id } })
    await removeStoredFile(submission.storedFileName).catch(() => null)
  }
  refresh(["/assessments"])
  redirect("/assessments")
}

export async function deleteResult(formData: FormData) {
  const denied = await staffError()
  if (denied) redirect("/results")

  const id = String(formData.get("id") ?? "")
  await prisma.result.delete({ where: { id } }).catch(() => null)
  refresh(["/results"])
  redirect("/results")
}

function uniqueTarget(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") {
    return null
  }

  const meta = "meta" in error ? (error as { meta?: { target?: unknown } }).meta : undefined
  const target = meta?.target
  if (Array.isArray(target)) return target.map(String)
  if (typeof target === "string") return [target]

  const message = error instanceof Error ? error.message : ""
  const constraint = message.match(/constraint: `([^`]+)`/)?.[1]
  return [constraint ?? ""]
}
