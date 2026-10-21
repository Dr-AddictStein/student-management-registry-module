import { ConfirmDelete } from "@/components/confirm-delete"

export function Notice({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
}

export function RowActions({
  edit,
  id,
  label,
  action,
}: {
  edit: React.ReactNode
  id: string
  label: string
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {edit}
      <ConfirmDelete action={action} id={id} label={label} />
    </div>
  )
}
