import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { ModuleForm } from "@/components/registry-forms"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { prisma } from "@/lib/prisma"
import { deleteModule } from "@/lib/registry-actions"
import { requireSession } from "@/lib/session"
import { EmptyRow, Notice, RecordTable, RowActions } from "@/components/record-list"

export default function ModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>
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
  searchParams: Promise<{ edit?: string; error?: string }>
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
  const editing = modules.find((module) => module.id === params.edit)

  return (
    <>
      <PageHeader
        title="Modules"
        description="Assessments belong to a module. Create the programme first, then add its modules here."
      />
      <Notice message={params.error} />
      {programmes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a programme before creating modules.
        </p>
      ) : (
        <section className="mb-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <ModuleForm
            programmes={programmes}
            module={
              editing
                ? { id: editing.id, programmeId: editing.programmeId, code: editing.code, name: editing.name }
                : undefined
            }
          />
          {editing ? (
            <Link href="/modules" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
              Cancel editing
            </Link>
          ) : null}
        </section>
      )}
      <RecordTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Assessments</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.length === 0 ? (
              <EmptyRow span={5} message="No modules yet." />
            ) : (
              modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>{module.code}</TableCell>
                  <TableCell>{module.name}</TableCell>
                  <TableCell>{module.programme.name}</TableCell>
                  <TableCell>{module._count.assessments}</TableCell>
                  <TableCell>
                    <RowActions
                      editHref={`/modules?edit=${module.id}`}
                      id={module.id}
                      label={module.name}
                      action={deleteModule}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </RecordTable>
    </>
  )
}
