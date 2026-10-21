import Link from "next/link"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
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
  searchParams: Promise<{ edit?: string; error?: string }>
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
  searchParams: Promise<{ edit?: string; error?: string }>
}) {
  const session = await requireSession()
  if (session.role !== "staff") redirect("/")

  const params = await searchParams
  const programmes = await prisma.programme.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { modules: true, students: true } } },
  })
  const editing = programmes.find((programme) => programme.id === params.edit)

  return (
    <>
      <PageHeader
        title="Programmes"
        description="Add each programme here before students can enrol on it. Changing a fee does not rewrite what current students already owe."
      />
      <Notice message={params.error} />
      <section className="mb-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <ProgrammeForm
          programme={
            editing
              ? {
                  id: editing.id,
                  code: editing.code,
                  name: editing.name,
                  feeAmount: moneyInput(editing.feeAmount),
                }
              : undefined
          }
        />
        {editing ? (
          <Link href="/programmes" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
            Cancel editing
          </Link>
        ) : null}
      </section>
      <DataTable
        rows={programmes}
        rowKey={(programme) => programme.id}
        empty="No programmes yet. Add the first one above."
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
              <RowActions editHref={`/programmes?edit=${programme.id}`} id={programme.id} label={programme.name} action={deleteProgramme} />
            ),
          },
        ]}
      />
    </>
  )
}
