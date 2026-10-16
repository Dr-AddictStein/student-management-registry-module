"use server"

import { redirect } from "next/navigation"
import { EnrolmentError, createStudent } from "@/lib/enrolment"
import { parseAcademicYear, parseDateOfBirth } from "@/lib/domain"
import { hashPassword, passwordsMatch, verifyPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"
import { clearSession, setSession } from "@/lib/session"

export type AuthState = { error: string } | null

const PASSWORD_MIN = 8

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Enter your email and password." }
  }

  const staffEmail = process.env.STAFF_EMAIL?.trim().toLowerCase()
  const staffPassword = process.env.STAFF_PASSWORD

  if (!staffEmail || !staffPassword) {
    return { error: "Staff sign-in is not configured." }
  }

  if (email === staffEmail) {
    if (!passwordsMatch(password, staffPassword)) {
      return { error: "Email or password is incorrect." }
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
    return { error: "Email or password is incorrect." }
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
    return { error: "Enter the student's full name." }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." }
  }
  if (email === staffEmail) {
    return { error: "That email is reserved for the registry desk." }
  }
  if (password.length < PASSWORD_MIN) {
    return { error: `Use a password of at least ${PASSWORD_MIN} characters.` }
  }
  if (password !== confirmPassword) {
    return { error: "The passwords do not match." }
  }
  if (!dateOfBirth) {
    return { error: "Enter a date of birth. The student must be at least 16." }
  }
  if (!parseAcademicYear(academicYear)) {
    return { error: "Enter the academic year as 2025/26." }
  }
  if (!programmeId) {
    return { error: "Choose a programme." }
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
    if (error instanceof EnrolmentError) return { error: error.message }
    throw error
  }

  redirect("/")
}

export async function logout() {
  await clearSession()
  redirect("/login")
}
