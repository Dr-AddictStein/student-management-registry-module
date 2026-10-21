"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inspectUpload, removeStoredFile, writeStoredFile } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export type SubmissionState = { error: string } | null

export async function submitWork(_state: SubmissionState, formData: FormData): Promise<SubmissionState> {
  const session = await getSession()
  if (!session) return { error: "Sign in as a student to submit work." }
  if (session.role !== "student") return { error: "Only a student can submit work." }

  const assessmentId = String(formData.get("assessmentId") ?? "")
  const file = formData.get("file")
  if (!assessmentId) return { error: "Choose an assessment." }
  if (!(file instanceof File)) return { error: "Choose a PDF or DOCX file." }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const inspected = inspectUpload(file, bytes)
  if ("error" in inspected) return inspected

  const result = await recordSubmission({
    studentId: session.studentId,
    assessmentId,
    originalFileName: inspected.originalFileName,
    mimeType: inspected.mimeType,
    extension: inspected.extension,
    bytes: inspected.bytes,
  })
  if ("error" in result) return result

  revalidatePath("/assessments")
  redirect("/assessments")
}

export async function recordSubmission(input: {
  studentId: string
  assessmentId: string
  originalFileName: string
  mimeType: string
  extension: "pdf" | "docx"
  bytes: Uint8Array
}): Promise<{ error: string } | { ok: true }> {
  const [student, assessment] = await Promise.all([
    prisma.student.findUnique({
      where: { id: input.studentId },
      select: { programmeId: true, enrolmentStatus: true },
    }),
    prisma.assessment.findUnique({
      where: { id: input.assessmentId },
      select: { deadline: true, module: { select: { programmeId: true } } },
    }),
  ])
  if (!student || !assessment) return { error: "That assessment is no longer available." }
  if (student.enrolmentStatus !== "ENROLLED") {
    return { error: "Only enrolled students can submit work." }
  }
  if (student.programmeId !== assessment.module.programmeId) {
    return { error: "That assessment is not on your programme." }
  }

  const existing = await prisma.submission.findUnique({
    where: { assessmentId_studentId: { assessmentId: input.assessmentId, studentId: input.studentId } },
    select: { id: true, storedFileName: true },
  })
  const submittedAt = new Date()
  if (existing && submittedAt > assessment.deadline) {
    return { error: "The deadline has passed, so this file cannot be replaced." }
  }

  const storedFileName = await writeStoredFile(input.extension, input.bytes)
  const data = {
    originalFileName: input.originalFileName,
    storedFileName,
    mimeType: input.mimeType,
    sizeBytes: input.bytes.byteLength,
    submittedAt,
    isLate: submittedAt > assessment.deadline,
  }

  try {
    if (existing) {
      await prisma.submission.update({ where: { id: existing.id }, data })
      if (existing.storedFileName !== storedFileName) {
        await removeStoredFile(existing.storedFileName).catch(() => null)
      }
    } else {
      await prisma.submission.create({
        data: { assessmentId: input.assessmentId, studentId: input.studentId, ...data },
      })
    }
  } catch (error) {
    await removeStoredFile(storedFileName).catch(() => null)
    if (uniqueSubmission(error)) {
      return { error: "You already have a submission for this assessment. Refresh the page to replace it." }
    }
    throw error
  }

  return { ok: true }
}

function uniqueSubmission(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002"
}
