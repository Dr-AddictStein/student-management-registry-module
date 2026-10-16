import Link from "next/link"
import { ConfirmDelete } from "@/components/confirm-delete"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"

export function Notice({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
}

export function RecordTable({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-card ring-1 ring-foreground/10">{children}</div>
}

export function EmptyRow({ span, message }: { span: number; message: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={span} className="h-24 text-center whitespace-normal text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  )
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
    <div className="flex items-center justify-end gap-2">
      <Link href={editHref}>
        <Badge variant="outline">Edit</Badge>
      </Link>
      <ConfirmDelete action={action} id={id} label={label} />
    </div>
  )
}
