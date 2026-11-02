import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { pageHref } from "@/lib/pagination"
import { cn } from "@/lib/utils"

export function ListPagination({
  pathname,
  current,
  pageCount,
  from,
  to,
  total,
}: {
  pathname: string
  current: number
  pageCount: number
  from: number
  to: number
  total: number
}) {
  if (total === 0) return null

  const pages = visiblePages(current, pageCount)

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={pageHref(pathname, current - 1)} disabled={current <= 1}>
          Previous
        </PageLink>
        {pages.map((page) => (
          <PageLink key={page} href={pageHref(pathname, page)} current={page === current}>
            {page}
          </PageLink>
        ))}
        <PageLink href={pageHref(pathname, current + 1)} disabled={current >= pageCount}>
          Next
        </PageLink>
      </div>
    </nav>
  )
}

function PageLink({
  href,
  disabled,
  current,
  children,
}: {
  href: string
  disabled?: boolean
  current?: boolean
  children: React.ReactNode
}) {
  const className = cn(buttonVariants({ variant: current ? "default" : "outline", size: "sm" }), "min-w-8")

  if (disabled) {
    return (
      <span className={cn(className, "pointer-events-none opacity-50")} aria-disabled="true">
        {children}
      </span>
    )
  }

  return (
    <Link href={href} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  )
}

function visiblePages(current: number, pageCount: number) {
  const start = Math.max(1, Math.min(current - 2, pageCount - 4))
  const end = Math.min(pageCount, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
