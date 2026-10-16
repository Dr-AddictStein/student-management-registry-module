import { getSession } from "@/lib/session"

export async function staffError() {
  const session = await getSession()
  if (!session) return "Sign in as registry staff."
  if (session.role !== "staff") return "Only registry staff can change the register."
  return null
}
