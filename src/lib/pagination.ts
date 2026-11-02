export const PAGE_SIZE = 5

export function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return page < 1 ? 1 : page
}

export function paginate(page: number, total: number, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount)
  const skip = (current - 1) * pageSize
  const from = total === 0 ? 0 : skip + 1
  const to = Math.min(skip + pageSize, total)
  return { current, pageCount, skip, pageSize, from, to, total }
}

export function pageHref(
  pathname: string,
  page: number,
  query?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value)
  }
  if (page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `${pathname}?${search}` : pathname
}
