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

export function pageHref(pathname: string, page: number) {
  return page <= 1 ? pathname : `${pathname}?page=${page}`
}
