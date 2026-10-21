import { DataTable } from "@/components/data-table"

export function PlaceholderTable({
  columns,
  message,
}: {
  columns: string[]
  message: string
}) {
  return (
    <DataTable
      rows={[]}
      rowKey={() => "empty"}
      empty={message}
      columns={columns.map((column) => ({
        key: column,
        header: column,
        cell: () => null,
      }))}
    />
  )
}
