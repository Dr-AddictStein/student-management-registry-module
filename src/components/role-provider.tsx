"use client"

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react"

export type RegistryRole = "staff" | "student"

const STORAGE_KEY = "sms-registry-role"
const ROLE_EVENT = "sms-registry-role-change"

type RoleContextValue = {
  role: RegistryRole
  setRole: (role: RegistryRole) => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

function subscribe(onStoreChange: () => void) {
  window.addEventListener(ROLE_EVENT, onStoreChange)
  return () => window.removeEventListener(ROLE_EVENT, onStoreChange)
}

function readRole(): RegistryRole {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "staff" || stored === "student") return stored

  const cookie = document.cookie.match(
    /(?:^|; )sms-registry-role=(staff|student)/,
  )
  return cookie?.[1] === "student" ? "student" : "staff"
}

function getServerRole(): RegistryRole {
  return "staff"
}

function setStoredRole(next: RegistryRole) {
  window.localStorage.setItem(STORAGE_KEY, next)
  document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`
  window.dispatchEvent(new Event(ROLE_EVENT))
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const role = useSyncExternalStore(subscribe, readRole, getServerRole)

  return (
    <RoleContext.Provider value={{ role, setRole: setStoredRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const value = useContext(RoleContext)
  if (!value) {
    throw new Error("useRole must be used within RoleProvider.")
  }
  return value
}

export function RoleContent({
  staff,
  student,
}: {
  staff: ReactNode
  student: ReactNode
}) {
  const { role } = useRole()
  return role === "student" ? student : staff
}
