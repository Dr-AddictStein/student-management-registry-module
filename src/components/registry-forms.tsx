"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ENROLMENT_STATUSES, ENROLMENT_STATUS_LABELS, type EnrolmentStatus } from "@/lib/domain"
import {
  saveAssessment,
  saveModule,
  savePayment,
  saveProgramme,
  saveResult,
  saveStudent,
  type FormState,
} from "@/lib/registry-actions"

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function ProgrammeForm({
  programme,
}: {
  programme?: { id: string; code: string; name: string; feeAmount: string }
}) {
  const [state, action, pending] = useActionState(saveProgramme, null as FormState)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <FormError message={state?.error} />
      <input type="hidden" name="id" value={programme?.id ?? ""} />
      <Field label="Code">
        <Input name="code" defaultValue={programme?.code} required />
      </Field>
      <Field label="Name" className="sm:col-span-2">
        <Input name="name" defaultValue={programme?.name} required />
      </Field>
      <Field label="Fee">
        <Input name="feeAmount" defaultValue={programme?.feeAmount} inputMode="decimal" required />
      </Field>
      <div className="sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : programme ? "Update programme" : "Add programme"}
        </Button>
      </div>
    </form>
  )
}

export function ModuleForm({
  programmes,
  module,
}: {
  programmes: { id: string; name: string }[]
  module?: { id: string; programmeId: string; code: string; name: string }
}) {
  const [state, action, pending] = useActionState(saveModule, null as FormState)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <FormError message={state?.error} />
      <input type="hidden" name="id" value={module?.id ?? ""} />
      <Field label="Programme" className="sm:col-span-2">
        <select name="programmeId" defaultValue={module?.programmeId ?? ""} required className={selectClass}>
          <option value="" disabled>
            Choose a programme
          </option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Code">
        <Input name="code" defaultValue={module?.code} required />
      </Field>
      <Field label="Name">
        <Input name="name" defaultValue={module?.name} required />
      </Field>
      <div className="sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : module ? "Update module" : "Add module"}
        </Button>
      </div>
    </form>
  )
}

export function StudentForm({
  programmes,
  defaultDueDate,
  student,
}: {
  programmes: { id: string; name: string }[]
  defaultDueDate?: string
  student?: {
    id: string
    fullName: string
    email: string
    dateOfBirth: string
    programmeId: string
    academicYear: string
    enrolmentStatus: EnrolmentStatus
    assignedFee: string
    feeDueDate: string
  }
}) {
  const [state, action, pending] = useActionState(saveStudent, null as FormState)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <FormError message={state?.error} />
      <input type="hidden" name="id" value={student?.id ?? ""} />
      <Field label="Full name">
        <Input name="fullName" defaultValue={student?.fullName} required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" defaultValue={student?.email} required />
      </Field>
      <Field label={student ? "New password (optional)" : "Password"}>
        <Input name="password" type="password" autoComplete="new-password" required={!student} />
      </Field>
      <Field label="Confirm password">
        <Input name="confirmPassword" type="password" autoComplete="new-password" required={!student} />
      </Field>
      <Field label="Date of birth">
        <Input name="dateOfBirth" type="date" defaultValue={student?.dateOfBirth} required />
      </Field>
      <Field label="Academic year">
        <Input name="academicYear" defaultValue={student?.academicYear} placeholder="2025/26" required />
      </Field>
      <Field label="Programme">
        <select name="programmeId" defaultValue={student?.programmeId ?? ""} required className={selectClass}>
          <option value="" disabled>
            Choose a programme
          </option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select name="enrolmentStatus" defaultValue={student?.enrolmentStatus ?? "ENROLLED"} className={selectClass}>
          {ENROLMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ENROLMENT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>
      {student ? (
        <Field label="Assigned fee">
          <Input name="assignedFee" defaultValue={student.assignedFee} inputMode="decimal" required />
        </Field>
      ) : null}
      <Field label="Fee due date">
        <Input name="feeDueDate" type="date" defaultValue={student?.feeDueDate ?? defaultDueDate} required />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : student ? "Update student" : "Add student"}
        </Button>
      </div>
    </form>
  )
}

export function AssessmentForm({
  modules,
  assessment,
}: {
  modules: { id: string; label: string }[]
  assessment?: { id: string; title: string; moduleId: string; deadline: string }
}) {
  const [state, action, pending] = useActionState(saveAssessment, null as FormState)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <FormError message={state?.error} />
      <input type="hidden" name="id" value={assessment?.id ?? ""} />
      <Field label="Title" className="sm:col-span-2">
        <Input name="title" defaultValue={assessment?.title} required />
      </Field>
      <Field label="Module">
        <select name="moduleId" defaultValue={assessment?.moduleId ?? ""} required className={selectClass}>
          <option value="" disabled>
            Choose a module
          </option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Deadline (UTC)">
        <Input name="deadline" type="datetime-local" defaultValue={assessment?.deadline} required />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : assessment ? "Update assessment" : "Add assessment"}
        </Button>
      </div>
    </form>
  )
}

export function PaymentForm({
  students,
  payment,
}: {
  students: { id: string; label: string }[]
  payment?: { id: string; studentId: string; amount: string; paidOn: string; reference: string }
}) {
  const [state, action, pending] = useActionState(savePayment, null as FormState)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <FormError message={state?.error} />
      <input type="hidden" name="id" value={payment?.id ?? ""} />
      <Field label="Student" className="sm:col-span-2">
        <select name="studentId" defaultValue={payment?.studentId ?? ""} required className={selectClass}>
          <option value="" disabled>
            Choose a student
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Amount">
        <Input name="amount" defaultValue={payment?.amount} inputMode="decimal" required />
      </Field>
      <Field label="Date">
        <Input name="paidOn" type="date" defaultValue={payment?.paidOn} required />
      </Field>
      <Field label="Reference" className="sm:col-span-2">
        <Input name="reference" defaultValue={payment?.reference} required />
      </Field>
      <div className="sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : payment ? "Update payment" : "Record payment"}
        </Button>
      </div>
    </form>
  )
}

export function ResultForm({
  students,
  assessments,
  result,
}: {
  students: { id: string; label: string }[]
  assessments: { id: string; label: string }[]
  result?: { id: string; studentId: string; assessmentId: string; grade: number; published: boolean }
}) {
  const [state, action, pending] = useActionState(saveResult, null as FormState)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <FormError message={state?.error} />
      <input type="hidden" name="id" value={result?.id ?? ""} />
      <Field label="Student">
        <select name="studentId" defaultValue={result?.studentId ?? ""} required className={selectClass}>
          <option value="" disabled>
            Choose a student
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Assessment">
        <select name="assessmentId" defaultValue={result?.assessmentId ?? ""} required className={selectClass}>
          <option value="" disabled>
            Choose an assessment
          </option>
          {assessments.map((assessment) => (
            <option key={assessment.id} value={assessment.id}>
              {assessment.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Grade (0–100)">
        <Input name="grade" type="number" min={0} max={100} step={1} defaultValue={result?.grade} required />
      </Field>
      <label className="flex items-end gap-2 pb-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={result?.published} />
        Publish this result
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : result ? "Update grade" : "Save grade"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`space-y-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-full" role="alert">
      {message}
    </p>
  )
}
