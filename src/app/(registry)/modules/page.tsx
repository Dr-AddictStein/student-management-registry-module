import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { RecordModal } from "@/components/record-modal"
import { Notice, RowActions } from "@/components/record-list"
import { ModuleForm } from "@/components/registry-forms"
import { prisma } from "@/lib/prisma"
import { deleteModule } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"

export default function ModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading modules…</p>}>
      <ModulesContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ModulesContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireSession()
  if (session.role !== "staff") redirect("/")

  const params = await searchParams
  const [programmes, modules] = await Promise.all([
    prisma.programme.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.module.findMany({
      orderBy: [{ programme: { name: "asc" } }, { code: "asc" }],
      include: { programme: { select: { name: true } }, _count: { select: { assessments: true } } },
    }),
  ])
  return (
    <>
      <PageHeader
        title="Modules"
        description="Assessments belong to a module. Create the programme first, then add its modules here."
        action={
          programmes.length > 0 ? (
            <RecordModal title="Add module" trigger="Add module">
              <ModuleForm programmes={programmes} />
            </RecordModal>
          ) : null
        }
      />
      <Notice message={params.error} />
      {programmes.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">Add a programme before creating modules.</p>
      ) : null}
      <DataTable
        rows={modules}
        rowKey={(module) => module.id}
        empty="No modules yet."
        columns={[
          { key: "code", header: "Code", cell: (module) => module.code },
          { key: "name", header: "Name", cell: (module) => module.name },
          { key: "programme", header: "Programme", cell: (module) => module.programme.name },
          { key: "assessments", header: "Assessments", cell: (module) => module._count.assessments },
          {
            key: "actions",
            header: "",
            cell: (module) => (
              <RowActions
                id={module.id}
                label={module.name}
                action={deleteModule}
                edit={
                  <RecordModal title="Edit module" trigger="Edit" appearance="edit">
                    <ModuleForm
                      programmes={programmes}
                      module={{
                        id: module.id,
                        programmeId: module.programmeId,
                        code: module.code,
                        name: module.name,
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
