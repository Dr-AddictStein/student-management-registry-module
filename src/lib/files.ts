import { randomUUID } from "node:crypto"
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

const PDF_MIME = "application/pdf"
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const MAX_BYTES = 10 * 1024 * 1024

export type AcceptedUpload = {
  extension: "pdf" | "docx"
  mimeType: string
  originalFileName: string
  bytes: Uint8Array
}

export function inspectUpload(file: File, bytes: Uint8Array): AcceptedUpload | { error: string } {
  if (file.size === 0 || bytes.byteLength === 0) return { error: "Choose a file that is not empty." }
  if (file.size > MAX_BYTES || bytes.byteLength > MAX_BYTES) {
    return { error: "The file must be 10 MB or smaller." }
  }

  const originalFileName = sanitizeFileName(file.name)
  const extension = extensionOf(originalFileName)
  if (!extension) return { error: "Upload a PDF or DOCX file." }

  const declared = file.type.trim().toLowerCase()
  if (extension === "pdf" && declared && declared !== PDF_MIME && declared !== "application/octet-stream") {
    return { error: "That file is not a PDF." }
  }
  if (
    extension === "docx" &&
    declared &&
    declared !== DOCX_MIME &&
    declared !== "application/octet-stream" &&
    declared !== "application/zip"
  ) {
    return { error: "That file is not a Word document." }
  }
  if (extension === "pdf" && !isPdf(bytes)) return { error: "That file is not a PDF." }
  if (extension === "docx" && !isDocx(bytes)) return { error: "That file is not a Word document." }

  return {
    extension,
    mimeType: extension === "pdf" ? PDF_MIME : DOCX_MIME,
    originalFileName,
    bytes,
  }
}

export async function writeStoredFile(extension: "pdf" | "docx", bytes: Uint8Array) {
  const storedFileName = path.posix.join("submissions", `${randomUUID()}.${extension}`)
  const destination = storedPath(storedFileName)
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, bytes, { flag: "wx" })
  return storedFileName
}

export async function readStoredFile(storedFileName: string) {
  return readFile(storedPath(storedFileName))
}

export async function removeStoredFile(storedFileName: string) {
  await unlink(storedPath(storedFileName)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error
  })
}

export function storedPath(storedFileName: string) {
  if (!storedFileName || storedFileName.includes("\0")) {
    throw new Error("Invalid stored file name.")
  }
  const root = path.resolve(process.cwd(), "storage")
  const full = path.resolve(root, storedFileName)
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Invalid stored file name.")
  }
  return full
}

export function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\w.\- ]+/g, "_")
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

function sanitizeFileName(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "submission"
  return base.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 120)
}

function extensionOf(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith(".pdf")) return "pdf" as const
  if (lower.endsWith(".docx")) return "docx" as const
  return null
}

function isPdf(bytes: Uint8Array) {
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
}

function isDocx(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false
  return Buffer.from(bytes).toString("latin1").includes("word/document.xml")
}
