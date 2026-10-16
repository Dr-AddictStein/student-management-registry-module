import { compare, hash } from "bcryptjs"
import { timingSafeEqual } from "node:crypto"

const BCRYPT_COST = 12

export function hashPassword(password: string) {
  return hash(password, BCRYPT_COST)
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash)
}

export function passwordsMatch(input: string, expected: string) {
  const left = Buffer.from(input)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}
