import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { RecordModal } from "@/components/record-modal"
import { Notice, RowActions } from "@/components/record-list"
import { ProgrammeForm } from "@/components/registry-forms"
import { formatAmount } from "@/lib/domain"
import { moneyInput } from "@/lib/inputs"
import { prisma } from "@/lib/prisma"
import { deleteProgramme } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default function ProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading programmes…</p>}>
      <ProgrammesContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ProgrammesContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireSession()
  if (session.role !== "staff") redirect("/")

  const params = await searchParams
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { modules: true, students: true } } },
  })
  return (
    <>
      <PageHeader
        title="Programmes"
        description="Add each programme here before students can enrol on it. Changing a fee does not rewrite what current students already owe."
        action={
          <RecordModal title="Add programme" trigger="Add programme">
            <ProgrammeForm />
          </RecordModal>
        }
      />
      <Notice message={params.error} />
      <DataTable
        rows={programmes}
        rowKey={(programme) => programme.id}
        empty="No programmes yet."
        columns={[
          { key: "code", header: "Code", cell: (programme) => programme.code },
          { key: "name", header: "Name", cell: (programme) => programme.name },
          { key: "fee", header: "Fee", cell: (programme) => formatAmount(programme.feeAmount) },
          { key: "modules", header: "Modules", cell: (programme) => programme._count.modules },
          { key: "students", header: "Students", cell: (programme) => programme._count.students },
          {
            key: "actions",
            header: "",
            cell: (programme) => (
              <RowActions
                id={programme.id}
                label={programme.name}
                action={deleteProgramme}
                edit={
                  <RecordModal title="Edit programme" trigger="Edit" appearance="edit">
                    <ProgrammeForm
                      programme={{
                        id: programme.id,
                        code: programme.code,
                        name: programme.name,
                        feeAmount: moneyInput(programme.feeAmount),
                      }}
                    />
                  </RecordModal>
                }
              />
            ),
          },
        ]}
      />
    </>
  )
}
