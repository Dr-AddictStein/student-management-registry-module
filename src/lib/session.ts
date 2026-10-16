import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { readSession, SESSION_COOKIE, signSession, type Session } from "@/lib/session-token"

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7

export async function getSession() {
  const store = await cookies()
  return readSession(store.get(SESSION_COOKIE)?.value)
}

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

export async function setSession(session: Session) {
  const store = await cookies()
  store.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_IN_SECONDS,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
