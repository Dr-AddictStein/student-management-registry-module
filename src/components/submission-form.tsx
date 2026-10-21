"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { submitWork, type SubmissionState } from "@/lib/submission-actions"

export function SubmissionForm({
  assessmentId,
  replacing,
  late,
}: {
  assessmentId: string
  replacing: boolean
  late: boolean
}) {
  const [state, action, pending] = useActionState(submitWork, null as SubmissionState)

  return (
    <form action={action} className="mt-2 grid gap-2">
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input
        name="file"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        required
        className="max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Uploading…" : replacing ? "Replace file" : "Upload"}
        </Button>
        {late ? <span className="text-xs text-muted-foreground">This first submission will be marked late.</span> : null}
      </div>
    </form>
  )
}
