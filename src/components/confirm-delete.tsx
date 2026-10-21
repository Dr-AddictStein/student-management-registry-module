"use client"

import { Button } from "@/components/ui/button"

export function ConfirmDelete({
  action,
  id,
  label,
}: {
  action: (formData: FormData) => void
  id: string
  label: string
}) {
  return (
    <form
      className="inline-flex justify-center"
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${label}?`)) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="destructive">
        Delete
      </Button>
    </form>
  )
}
