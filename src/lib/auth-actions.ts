"use server"

import { redirect } from "next/navigation"
import { EnrolmentError, createStudent } from "@/lib/enrolment"
import { parseAcademicYear, parseDateOfBirth } from "@/lib/domain"
import { hashPassword, passwordsMatch, verifyPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"
import { clearSession, setSession } from "@/lib/session"

export type RegisterField =
  | "fullName"
  | "email"
  | "password"
  | "confirmPassword"
  | "dateOfBirth"
  | "academicYear"
  | "programmeId"

export type AuthState = { error: string; clear?: RegisterField[] } | null

const PASSWORD_MIN = 8

function reject(error: string, ...clear: RegisterField[]): AuthState {
  return clear.length > 0 ? { error, clear } : { error }
}

function enrolmentClear(error: EnrolmentError): RegisterField[] {
  if (error.issue === "email") return ["email"]
  if (error.issue === "programme") return ["programmeId"]
  if (error.issue === "academicYear") return ["academicYear"]
  return []
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return reject("Enter your email and password.")
  }

  const staffEmail = process.env.STAFF_EMAIL?.trim().toLowerCase()
  const staffPassword = process.env.STAFF_PASSWORD

  if (!staffEmail || !staffPassword) {
    return reject("Staff sign-in is not configured.")
  }

  if (email === staffEmail) {
    if (!passwordsMatch(password, staffPassword)) {
      return reject("Email or password is incorrect.")
    }

    await setSession({
      role: "staff",
      email: staffEmail,
      name: "Registry staff",
    })
    redirect("/")
  }

  const student = await prisma.student.findUnique({ where: { email } })
  if (!student || !(await verifyPassword(password, student.passwordHash))) {
    return reject("Email or password is incorrect.")
  }

  await setSession({
    role: "student",
    email: student.email,
    name: student.fullName,
    studentId: student.id,
  })
  redirect("/")
}

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "").trim().replace(/\s+/g, " ")
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")
  const dateOfBirth = parseDateOfBirth(String(formData.get("dateOfBirth") ?? ""))
  const academicYear = String(formData.get("academicYear") ?? "").trim()
  const programmeId = String(formData.get("programmeId") ?? "")
  const staffEmail = process.env.STAFF_EMAIL?.trim().toLowerCase()

  if (fullName.length < 2 || fullName.length > 120) {
    return reject("Enter the student's full name.", "fullName")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reject("Enter a valid email address.", "email")
  }
  if (email === staffEmail) {
    return reject("That email is reserved for the registry desk.", "email")
  }
  if (password.length < PASSWORD_MIN) {
    return reject(`Use a password of at least ${PASSWORD_MIN} characters.`, "password", "confirmPassword")
  }
  if (password !== confirmPassword) {
    return reject("The passwords do not match.", "password", "confirmPassword")
  }
  if (!dateOfBirth) {
    return reject("Enter a date of birth. The student must be at least 16.", "dateOfBirth")
  }
  if (!parseAcademicYear(academicYear)) {
    return reject("Enter the academic year as 2025/26.", "academicYear")
  }
  if (!programmeId) {
    return reject("Choose a programme.", "programmeId")
  }

  try {
    const student = await createStudent({
      fullName,
      email,
      passwordHash: await hashPassword(password),
      dateOfBirth,
      academicYear,
      programmeId,
    })

    await setSession({
      role: "student",
      email: student.email,
      name: student.fullName,
      studentId: student.id,
    })
  } catch (error) {
    if (error instanceof EnrolmentError) return reject(error.message, ...enrolmentClear(error))
    throw error
  }

  redirect("/")
}

export async function logout() {
  await clearSession()
  redirect("/login")
}
