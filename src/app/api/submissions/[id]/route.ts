import { contentDisposition, readStoredFile } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/session"

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession()
  const { id } = await params
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { studentId: true, originalFileName: true, storedFileName: true, mimeType: true },
  })
  if (!submission) return new Response("Submission not found.", { status: 404 })
  if (session.role === "student" && session.studentId !== submission.studentId) {
    return new Response("You can only download your own submission.", { status: 403 })
  }

  try {
    const bytes = await readStoredFile(submission.storedFileName)
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": ALLOWED_TYPES.has(submission.mimeType) ? submission.mimeType : "application/octet-stream",
        "Content-Disposition": contentDisposition(submission.originalFileName),
        "Content-Length": String(bytes.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new Response("This file is not on disk.", { status: 404 })
  }
}
