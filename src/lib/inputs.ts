export function moneyInput(amount: { toString(): string } | number | string) {
  const value = typeof amount === "number" ? amount : Number(amount.toString())
  return value.toFixed(2)
}

export function parseMoney(value: string) {
  const trimmed = value.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return null
  return amount.toFixed(2)
}

export function parseUtcDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null
  return date
}

export function parseUtcDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function toDateTimeInput(date: Date) {
  return date.toISOString().slice(0, 16)
}

export function todayUtcDate() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}
