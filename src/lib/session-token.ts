import { jwtVerify, SignJWT } from "jose"

export const SESSION_COOKIE = "sms_session"

export type Session =
  | { role: "staff"; email: string; name: string }
  | { role: "student"; email: string; name: string; studentId: string }

function secret() {
  const value = process.env.SESSION_SECRET
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.")
  }
  return new TextEncoder().encode(value)
}

export async function signSession(session: Session) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret())
}

export async function readSession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    if (payload.role === "staff" && typeof payload.email === "string" && typeof payload.name === "string") {
      return { role: "staff", email: payload.email, name: payload.name }
    }
    if (
      payload.role === "student" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      typeof payload.studentId === "string"
    ) {
      return {
        role: "student",
        email: payload.email,
        name: payload.name,
        studentId: payload.studentId,
      }
    }
  } catch {
    return null
  }

  return null
}
