import { docxParagraphs, docxPreviewDocument } from "@/lib/docx-text"
import { contentDisposition, readStoredFile } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/session"

const PDF_MIME = "application/pdf"
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const ALLOWED_TYPES = new Set([PDF_MIME, DOCX_MIME])

const PREVIEW_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'",
  "X-Frame-Options": "SAMEORIGIN",
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession()
  const { id } = await params
  const view = new URL(request.url).searchParams.get("view") === "1"
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { studentId: true, originalFileName: true, storedFileName: true, mimeType: true },
  })
  if (!submission) return missing(view, "Submission not found.")
  if (session.role === "student" && session.studentId !== submission.studentId) {
    return new Response("You can only download your own submission.", { status: 403 })
  }

  try {
    const bytes = await readStoredFile(submission.storedFileName)
    if (view && submission.mimeType === DOCX_MIME) {
      const html = docxPreviewDocument(submission.originalFileName, docxParagraphs(bytes))
      return new Response(html, { headers: PREVIEW_HEADERS })
    }

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": ALLOWED_TYPES.has(submission.mimeType) ? submission.mimeType : "application/octet-stream",
        "Content-Disposition": contentDisposition(submission.originalFileName, view ? "inline" : "attachment"),
        "Content-Length": String(bytes.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return missing(view, "This file is not on disk.")
  }
}

function missing(view: boolean, message: string) {
  if (!view) return new Response(message, { status: 404 })
  return new Response(docxPreviewDocument("Submission", [message]), {
    status: 404,
    headers: PREVIEW_HEADERS,
  })
}
