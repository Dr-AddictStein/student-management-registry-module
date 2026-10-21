import { NextResponse, type NextRequest } from "next/server"
import { readSession, SESSION_COOKIE } from "@/lib/session-token"

const PUBLIC_PATHS = new Set(["/login", "/register", "/api/logout", "/docs"])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value)
  const isPublic = PUBLIC_PATHS.has(pathname)

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
