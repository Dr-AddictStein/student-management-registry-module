import "dotenv/config"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { hash } from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { classifyGrade, formatStudentNumber } from "../src/lib/domain"
import { storedPath } from "../src/lib/files"
import { docxDocument, pdfDocument } from "./sample-documents"

const DEMO_STUDENT_PASSWORD = "Password123!"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const day = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`)

async function writeSeedFile(storedFileName: string, bytes: Buffer) {
  const destination = storedPath(storedFileName)
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, bytes)
}

async function main() {
  const passwordHash = await hash(DEMO_STUDENT_PASSWORD, 12)

  await prisma.result.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.student.deleteMany()
  await prisma.module.deleteMany()
  await prisma.programme.deleteMany()

  const computerScience = await prisma.programme.create({
    data: {
      code: "BSC-CS",
      name: "BSc Computer Science",
      feeAmount: "8500.00",
      modules: {
        create: [
          { code: "PROG101", name: "Programming Fundamentals" },
          { code: "DATA201", name: "Databases" },
        ],
      },
    },
    include: { modules: true },
  })

  const business = await prisma.programme.create({
    data: {
      code: "BA-BM",
      name: "BA Business Management",
      feeAmount: "7200.00",
      modules: {
        create: [
          { code: "MGMT101", name: "Principles of Management" },
          { code: "ACCT110", name: "Financial Accounting" },
        ],
      },
    },
    include: { modules: true },
  })

  const programming = computerScience.modules.find(
    (module) => module.code === "PROG101",
  )
  const databases = computerScience.modules.find(
    (module) => module.code === "DATA201",
  )
  const management = business.modules.find((module) => module.code === "MGMT101")

  if (!programming || !databases || !management) {
    throw new Error("Seed modules were not created.")
  }

  const programmingCoursework = await prisma.assessment.create({
    data: {
      title: "Programming Fundamentals Coursework",
      moduleId: programming.id,
      deadline: new Date("2026-09-01T23:59:00.000Z"),
    },
  })

  const databaseReport = await prisma.assessment.create({
    data: {
      title: "Database Design Report",
      moduleId: databases.id,
      deadline: new Date("2026-11-15T23:59:00.000Z"),
    },
  })

  const managementCase = await prisma.assessment.create({
    data: {
      title: "Management Case Study",
      moduleId: management.id,
      deadline: new Date("2026-09-20T23:59:00.000Z"),
    },
  })

  const amira = await prisma.student.create({
    data: {
      studentNumber: formatStudentNumber(2025, 1),
      fullName: "Amira Hassan",
      email: "amira.hassan@example.edu",
      passwordHash,
      dateOfBirth: day("2004-03-12"),
      academicYear: "2025/26",
      enrolmentStatus: "ENROLLED",
      assignedFee: computerScience.feeAmount,
      feeDueDate: day("2025-10-01"),
      programmeId: computerScience.id,
    },
  })

  const jonah = await prisma.student.create({
    data: {
      studentNumber: formatStudentNumber(2025, 2),
      fullName: "Jonah Adeyemi",
      email: "jonah.adeyemi@example.edu",
      passwordHash,
      dateOfBirth: day("2003-11-02"),
      academicYear: "2025/26",
      enrolmentStatus: "ENROLLED",
      assignedFee: computerScience.feeAmount,
      feeDueDate: day("2026-11-01"),
      programmeId: computerScience.id,
    },
  })

  const priya = await prisma.student.create({
    data: {
      studentNumber: formatStudentNumber(2025, 3),
      fullName: "Priya Shah",
      email: "priya.shah@example.edu",
      passwordHash,
      dateOfBirth: day("2005-01-19"),
      academicYear: "2025/26",
      enrolmentStatus: "DEFERRED",
      assignedFee: business.feeAmount,
      feeDueDate: day("2025-09-15"),
      programmeId: business.id,
    },
  })

  const luca = await prisma.student.create({
    data: {
      studentNumber: formatStudentNumber(2025, 4),
      fullName: "Luca Moretti",
      email: "luca.moretti@example.edu",
      passwordHash,
      dateOfBirth: day("2002-07-30"),
      academicYear: "2025/26",
      enrolmentStatus: "WITHDRAWN",
      assignedFee: business.feeAmount,
      feeDueDate: day("2026-01-15"),
      programmeId: business.id,
    },
  })

  const elena = await prisma.student.create({
    data: {
      studentNumber: formatStudentNumber(2025, 5),
      fullName: "Elena Kowalska",
      email: "elena.kowalska@example.edu",
      passwordHash,
      dateOfBirth: day("2001-05-08"),
      academicYear: "2025/26",
      enrolmentStatus: "COMPLETED",
      assignedFee: computerScience.feeAmount,
      feeDueDate: day("2025-06-01"),
      programmeId: computerScience.id,
    },
  })

  const noah = await prisma.student.create({
    data: {
      studentNumber: formatStudentNumber(2025, 6),
      fullName: "Noah Bennett",
      email: "noah.bennett@example.edu",
      passwordHash,
      dateOfBirth: day("2004-09-21"),
      academicYear: "2025/26",
      enrolmentStatus: "ENROLLED",
      assignedFee: business.feeAmount,
      feeDueDate: day("2026-12-01"),
      programmeId: business.id,
    },
  })

  await prisma.payment.createMany({
    data: [
      {
        studentId: amira.id,
        amount: "3000.00",
        paidOn: day("2025-09-01"),
        reference: "PAY-2025-1001",
      },
      {
        studentId: jonah.id,
        amount: "8500.00",
        paidOn: day("2025-09-03"),
        reference: "PAY-2025-1002",
      },
      {
        studentId: luca.id,
        amount: "2000.00",
        paidOn: day("2025-10-01"),
        reference: "PAY-2025-1003",
      },
      {
        studentId: elena.id,
        amount: "8500.00",
        paidOn: day("2025-05-12"),
        reference: "PAY-2025-1004",
      },
      {
        studentId: noah.id,
        amount: "7200.00",
        paidOn: day("2026-09-01"),
        reference: "PAY-2026-1005",
      },
    ],
  })

  const amiraSubmittedAt = new Date("2026-08-20T10:15:00.000Z")
  const jonahSubmittedAt = new Date("2026-09-03T09:40:00.000Z")
  const elenaSubmittedAt = new Date("2026-08-01T16:05:00.000Z")
  const noahSubmittedAt = new Date("2026-09-18T11:20:00.000Z")
  const amiraFile = pdfDocument([
    "Programming Fundamentals Coursework",
    "Submitted by Amira Hassan (SMS-2025-0001).",
    "This coursework covers variables, control flow, and functions.",
  ])
  const jonahFile = pdfDocument([
    "Programming Fundamentals Coursework",
    "Submitted by Jonah Adeyemi (SMS-2025-0002).",
    "This file was handed in after the deadline.",
  ])
  const elenaFile = pdfDocument([
    "Programming Fundamentals Coursework",
    "Submitted by Elena Kowalska (SMS-2025-0005).",
    "Completed programme submission for PROG101.",
  ])
  const noahFile = docxDocument([
    "Principles of Management case study",
    "Submitted by Noah Bennett (SMS-2025-0006).",
    "The case compares two approaches to team leadership and recommends a weekly review.",
  ])
  await writeSeedFile("seed/amira-prog101.pdf", amiraFile)
  await writeSeedFile("seed/jonah-prog101.pdf", jonahFile)
  await writeSeedFile("seed/elena-prog101.pdf", elenaFile)
  await writeSeedFile("seed/noah-mgmt101.docx", noahFile)

  await prisma.submission.createMany({
    data: [
      {
        assessmentId: programmingCoursework.id,
        studentId: amira.id,
        originalFileName: "programming-coursework.pdf",
        storedFileName: "seed/amira-prog101.pdf",
        mimeType: "application/pdf",
        sizeBytes: amiraFile.byteLength,
        submittedAt: amiraSubmittedAt,
        isLate: amiraSubmittedAt > programmingCoursework.deadline,
      },
      {
        assessmentId: programmingCoursework.id,
        studentId: jonah.id,
        originalFileName: "coursework-final.pdf",
        storedFileName: "seed/jonah-prog101.pdf",
        mimeType: "application/pdf",
        sizeBytes: jonahFile.byteLength,
        submittedAt: jonahSubmittedAt,
        isLate: jonahSubmittedAt > programmingCoursework.deadline,
      },
      {
        assessmentId: programmingCoursework.id,
        studentId: elena.id,
        originalFileName: "prog101-elena.pdf",
        storedFileName: "seed/elena-prog101.pdf",
        mimeType: "application/pdf",
        sizeBytes: elenaFile.byteLength,
        submittedAt: elenaSubmittedAt,
        isLate: elenaSubmittedAt > programmingCoursework.deadline,
      },
      {
        assessmentId: managementCase.id,
        studentId: noah.id,
        originalFileName: "management-case-study.docx",
        storedFileName: "seed/noah-mgmt101.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: noahFile.byteLength,
        submittedAt: noahSubmittedAt,
        isLate: noahSubmittedAt > managementCase.deadline,
      },
    ],
  })

  const elenaGrade = 78
  const amiraGrade = 64
  const jonahGrade = 42
  const noahGrade = 55
  const publishedAt = new Date("2026-09-10T09:00:00.000Z")

  await prisma.result.createMany({
    data: [
      {
        assessmentId: programmingCoursework.id,
        studentId: elena.id,
        grade: elenaGrade,
        classification: classifyGrade(elenaGrade),
        published: true,
        publishedAt,
      },
      {
        assessmentId: programmingCoursework.id,
        studentId: amira.id,
        grade: amiraGrade,
        classification: classifyGrade(amiraGrade),
        published: false,
      },
      {
        assessmentId: programmingCoursework.id,
        studentId: jonah.id,
        grade: jonahGrade,
        classification: classifyGrade(jonahGrade),
        published: false,
      },
      {
        assessmentId: managementCase.id,
        studentId: noah.id,
        grade: noahGrade,
        classification: classifyGrade(noahGrade),
        published: true,
        publishedAt,
      },
    ],
  })

  console.log(
    `Seeded 2 programmes, 6 students, and 3 assessments. ${priya.fullName} is deferred with no payments. Open assessment: ${databaseReport.title}.`,
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
