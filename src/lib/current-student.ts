import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export async function loadStudent(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      studentNumber: true,
      fullName: true,
      email: true,
      dateOfBirth: true,
      academicYear: true,
      enrolmentStatus: true,
      assignedFee: true,
      feeDueDate: true,
      programme: { select: { name: true, code: true } },
    },
  })

  if (!student) redirect("/api/logout")
  return student
}
