import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function PlaceholderTable({
  columns,
  message,
}: {
  columns: string[]
  message: string
}) {
  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns.length}
              className="h-28 text-center whitespace-normal text-muted-foreground"
            >
              {message}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
