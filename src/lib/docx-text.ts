import { inflateRawSync } from "node:zlib"

const LOCAL_FILE_HEADER = 0x04034b50
const CENTRAL_DIRECTORY = 0x02014b50
const END_OF_CENTRAL_DIRECTORY = 0x06054b50

export function docxParagraphs(bytes: Buffer) {
  const xml = readZipEntry(bytes, "word/document.xml")
  if (!xml) return null

  return xml
    .toString("utf8")
    .split(/<w:p(?:\s[^>]*)?>/)
    .slice(1)
    .map((chunk) => paragraphText(chunk.split("</w:p>")[0] ?? ""))
    .filter((paragraph) => paragraph.length > 0)
}

export function docxPreviewDocument(fileName: string, paragraphs: string[] | null) {
  const title = escapeHtml(fileName)
  const body =
    paragraphs === null
      ? `<p>This Word document could not be previewed. Download the original file to open it in Word.</p>`
      : paragraphs.length === 0
        ? `<p>This document has no readable text. Download the original file to open it in Word.</p>`
        : paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { margin: 0; padding: 2rem 1.5rem; background: #fff; color: #1a1a1a; font: 1.05rem/1.6 Georgia, "Times New Roman", serif; }
  article { max-width: 42rem; margin: 0 auto; }
  p { margin: 0 0 1rem; white-space: pre-wrap; }
</style>
</head>
<body><article>${body}</article></body>
</html>`
}

function paragraphText(block: string) {
  const withBreaks = block.replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n").replace(/<w:cr\/>/g, "\n")
  return [...withBreaks.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map((match) => decodeXml(match[1]))
    .join("")
    .trim()
}

function readZipEntry(bytes: Buffer, entryName: string) {
  const directory = centralDirectory(bytes)
  if (!directory) return null
  const match = directory.find((entry) => entry.name.replaceAll("\\", "/") === entryName)
  if (!match) return null
  return inflateEntry(bytes, match.offset, match.method, match.compressedSize)
}

function centralDirectory(bytes: Buffer) {
  const end = findEndOfCentralDirectory(bytes)
  if (end === null) return null
  const count = bytes.readUInt16LE(end + 10)
  let offset = bytes.readUInt32LE(end + 16)
  if (offset === 0xffffffff || offset + 46 > bytes.length) return null

  const entries: { name: string; method: number; compressedSize: number; offset: number }[] = []
  for (let index = 0; index < count; index += 1) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== CENTRAL_DIRECTORY) return null
    const method = bytes.readUInt16LE(offset + 10)
    const compressedSize = bytes.readUInt32LE(offset + 20)
    const nameLength = bytes.readUInt16LE(offset + 28)
    const extraLength = bytes.readUInt16LE(offset + 30)
    const commentLength = bytes.readUInt16LE(offset + 32)
    const localOffset = bytes.readUInt32LE(offset + 42)
    const nameStart = offset + 46
    if (nameStart + nameLength > bytes.length || compressedSize === 0xffffffff || localOffset === 0xffffffff) return null
    entries.push({
      name: bytes.subarray(nameStart, nameStart + nameLength).toString("utf8"),
      method,
      compressedSize,
      offset: localOffset,
    })
    offset = nameStart + nameLength + extraLength + commentLength
  }
  return entries
}

function findEndOfCentralDirectory(bytes: Buffer) {
  const start = Math.max(0, bytes.length - 22 - 0xffff)
  for (let offset = bytes.length - 22; offset >= start; offset -= 1) {
    if (bytes.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) return offset
  }
  return null
}

function inflateEntry(bytes: Buffer, localOffset: number, method: number, compressedSize: number) {
  if (localOffset + 30 > bytes.length || bytes.readUInt32LE(localOffset) !== LOCAL_FILE_HEADER) return null
  const flags = bytes.readUInt16LE(localOffset + 6)
  if (flags & 0x1) return null
  const nameLength = bytes.readUInt16LE(localOffset + 26)
  const extraLength = bytes.readUInt16LE(localOffset + 28)
  const dataStart = localOffset + 30 + nameLength + extraLength
  if (dataStart + compressedSize > bytes.length) return null
  const compressed = bytes.subarray(dataStart, dataStart + compressedSize)
  if (method === 0) return Buffer.from(compressed)
  if (method !== 8) return null
  try {
    return inflateRawSync(compressed)
  } catch {
    return null
  }
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
