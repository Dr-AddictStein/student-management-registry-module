import Link from "next/link"
import { ConfirmDelete } from "@/components/confirm-delete"
import { Button } from "@/components/ui/button"

export function Notice({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
}

export function RowActions({
  editHref,
  id,
  label,
  action,
}: {
  editHref: string
  id: string
  label: string
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" nativeButton={false} render={<Link href={editHref} />}>
        Edit
      </Button>
      <ConfirmDelete action={action} id={id} label={label} />
    </div>
  )
}
