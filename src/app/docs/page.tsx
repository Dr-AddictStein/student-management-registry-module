import type { Metadata } from "next"
import { DataTable } from "@/components/data-table"
import { SwaggerPanel } from "@/components/swagger-panel"

export const metadata: Metadata = {
  title: "API documentation",
}

const routes = [
  {
    method: "GET",
    path: "/api/logout",
    auth: "Public",
    result: "Clears the cookie and redirects to /login.",
  },
  {
    method: "GET",
    path: "/api/submissions/{id}",
    auth: "Staff, or the student who owns the file",
    result: "Returns the PDF or DOCX. 403 if a student requests someone else's file. 404 if the row or the file is missing. No session redirects to /login.",
  },
]

const actions = [
  {
    name: "login",
    who: "Public",
    fields: "email, password",
    effect: "Opens a staff or student session. Staff is checked first. A wrong staff password does not fall through to a student account.",
  },
  {
    name: "register",
    who: "Public",
    fields: "fullName, email, password, confirmPassword, dateOfBirth, academicYear, programmeId",
    effect: "Creates an enrolled student, copies the programme fee, sets the due date 30 days ahead, issues the student ID, and signs them in.",
  },
  {
    name: "logout",
    who: "Signed in",
    fields: "none",
    effect: "Clears the session cookie. The same outcome as GET /api/logout.",
  },
  {
    name: "saveProgramme / deleteProgramme",
    who: "Staff",
    fields: "id, code, name, feeAmount",
    effect: "Creates or updates a programme. Delete is refused while modules or students still belong to it. Changing the fee does not rewrite existing students.",
  },
  {
    name: "saveModule / deleteModule",
    who: "Staff",
    fields: "id, programmeId, code, name",
    effect: "Creates or updates a module. The code is unique per programme. Delete is refused while assessments still belong to it.",
  },
  {
    name: "saveStudent / deleteStudent",
    who: "Staff",
    fields: "id, fullName, email, password, confirmPassword, dateOfBirth, academicYear, programmeId, enrolmentStatus, assignedFee, feeDueDate",
    effect: "Enrols or updates a student. The student ID is generated and cannot be edited. Delete is refused while payments, submissions, or grades exist.",
  },
  {
    name: "saveAssessment / deleteAssessment",
    who: "Staff",
    fields: "id, title, moduleId, deadline",
    effect: "Creates or updates an assessment. A deadline change recomputes which submissions are late. Delete is refused while submissions or grades exist.",
  },
  {
    name: "submitWork",
    who: "Enrolled student",
    fields: "assessmentId, file",
    effect: "Stores one PDF or DOCX for that student and assessment. A file can be replaced only before the deadline. The first file after the deadline is kept and marked late.",
  },
  {
    name: "deleteSubmission",
    who: "Staff",
    fields: "id",
    effect: "Removes the submission row and the stored file.",
  },
  {
    name: "savePayment / deletePayment",
    who: "Staff",
    fields: "id, studentId, amount, paidOn, reference",
    effect: "Records a payment. The amount must be greater than zero, not in the future, and not larger than the outstanding balance. The reference is unique.",
  },
  {
    name: "saveResult / deleteResult",
    who: "Staff",
    fields: "id, studentId, assessmentId, grade, published",
    effect: "Saves one grade from 0 to 100. Classification is derived. The student must belong to the assessment's programme. Students only see published rows.",
  },
]

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        PEN Registry
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">API documentation</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        The screens call Next.js Server Actions. Two HTTP routes sit beside those actions:
        ending a session, and downloading a submission. The machine-readable description of
        those routes is the OpenAPI document at{" "}
        <a className="underline-offset-4 hover:underline" href="/openapi.yaml">
          /openapi.yaml
        </a>
        . Import that file into Swagger Editor, Postman, or any OpenAPI 3 client.
      </p>

      <SwaggerPanel />

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Session</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        The cookie is <code>sms_session</code>. It is HTTP-only, lasts 7 days, and is signed
        with <code>SESSION_SECRET</code>. Staff identity comes from environment variables.
        Student identity comes from the student row. A signed-in visitor is sent away from
        <code> /login</code> and <code>/register</code>. Every other page requires a session.
      </p>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">HTTP routes</h2>
      <div className="mt-4">
        <DataTable
          rows={routes}
          rowKey={(route) => route.path}
          empty="No HTTP routes."
          columns={[
            { key: "method", header: "Method", cell: (route) => route.method },
            { key: "path", header: "Path", cell: (route) => route.path },
            { key: "auth", header: "Auth", cell: (route) => route.auth, className: "whitespace-normal" },
            { key: "result", header: "Result", cell: (route) => route.result, className: "whitespace-normal" },
          ]}
        />
      </div>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Server actions</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Each action reads a form, checks the role on the server, and either redirects on
        success or returns an error the form can show. Student-role callers cannot run
        staff actions. Hidden buttons are not the only guard.
      </p>
      <div className="mt-4">
        <DataTable
          rows={actions}
          rowKey={(action) => action.name}
          empty="No server actions."
          columns={[
            { key: "name", header: "Action", cell: (action) => action.name },
            { key: "who", header: "Who", cell: (action) => action.who },
            { key: "fields", header: "Fields", cell: (action) => action.fields, className: "whitespace-normal" },
            { key: "effect", header: "What it does", cell: (action) => action.effect, className: "whitespace-normal" },
          ]}
        />
      </div>
    </main>
  )
}
