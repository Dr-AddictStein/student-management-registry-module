import { todayUtcDate } from "@/lib/inputs"

export function moneyNumber(amount: { toString(): string } | number | string) {
  return typeof amount === "number" ? amount : Number(amount.toString())
}

export function sumPayments(payments: { amount: { toString(): string } }[]) {
  const total = payments.reduce((sum, payment) => sum + moneyNumber(payment.amount), 0)
  return Math.round(total * 100) / 100
}

export function outstandingBalance(assigned: { toString(): string } | number, paid: number) {
  return Math.round((moneyNumber(assigned) - paid) * 100) / 100
}

export function isOverdue(balance: number, due: Date, today = todayUtcDate()) {
  return balance > 0.001 && due.getTime() < today.getTime()
}
