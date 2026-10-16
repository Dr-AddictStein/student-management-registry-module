import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { PlaceholderTable } from "@/components/placeholder-table"
import { RoleContent } from "@/components/role-provider"

export const metadata: Metadata = {
  title: "Students",
}

export default function StudentsPage() {
  return (
    <RoleContent
      staff={
        <>
          <PageHeader
            title="Students"
            description="Enrol a student with their name, email, date of birth, programme, academic year, and status. The registry issues the student ID."
          />
          <PlaceholderTable
            columns={[
              "Student ID",
              "Name",
              "Email",
              "Programme",
              "Academic year",
              "Status",
            ]}
            message="Search and filters will query the student table. Enrolment is not connected yet."
          />
        </>
      }
      student={
        <>
          <PageHeader
            title="My enrolment"
            description="Your student ID, programme, academic year, and enrolment status will appear here once a student is selected."
          />
          <PlaceholderTable
            columns={["Student ID", "Programme", "Academic year", "Status"]}
            message="The student view will show the selected enrolment record."
          />
        </>
      }
    />
  )
}
