"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import {
  FileText,
  GraduationCap,
  LayoutDashboard,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRole, type RegistryRole } from "@/components/role-provider"
import { cn } from "@/lib/utils"

const staffNav: NavItem[] = [
  { href: "/", label: "Registry", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/fees", label: "Fees", icon: Wallet },
  { href: "/assessments", label: "Assessments", icon: FileText },
  { href: "/results", label: "Results", icon: GraduationCap },
]

const studentNav: NavItem[] = [
  { href: "/", label: "My record", icon: LayoutDashboard },
  { href: "/students", label: "Enrolment", icon: Users },
  { href: "/assessments", label: "Assessments", icon: FileText },
  { href: "/results", label: "Results", icon: GraduationCap },
  { href: "/fees", label: "Fees", icon: Wallet },
]

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export function RegistryShell({ children }: { children: React.ReactNode }) {
  const { role, setRole } = useRole()
  const items = role === "student" ? studentNav : staffNav

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60 md:border-r md:border-b-0">
        <div className="px-5 py-5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-sidebar-foreground/60 uppercase">
            PEN Registry
          </p>
          <p className="mt-1 text-base font-semibold tracking-tight">
            Student Management
          </p>
        </div>

        <Suspense fallback={<div className="flex-1" />}>
          <ShellNav items={items} />
        </Suspense>

        <div className="mt-auto border-t border-sidebar-border px-4 py-4">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-sidebar-foreground/60 uppercase">
            Viewing as
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/20 p-1">
            <RoleButton
              current={role}
              value="staff"
              onSelect={setRole}
            >
              Staff
            </RoleButton>
            <RoleButton
              current={role}
              value="student"
              onSelect={setRole}
            >
              Student
            </RoleButton>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-8">
          <p className="text-sm text-muted-foreground">
            {role === "staff"
              ? "Registry administrator"
              : "Student portal"}
          </p>
          <Badge variant="secondary">
            {role === "staff" ? "Staff view" : "Student view"}
          </Badge>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function ShellNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-3 md:pb-0">
      {items.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function RoleButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: RegistryRole
  value: RegistryRole
  onSelect: (role: RegistryRole) => void
  children: React.ReactNode
}) {
  const selected = current === value

  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "secondary" : "ghost"}
      className={cn(
        "h-7 text-sidebar-foreground",
        !selected && "hover:bg-white/10 hover:text-sidebar-foreground",
        selected && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
      )}
      aria-pressed={selected}
      onClick={() => onSelect(value)}
    >
      {children}
    </Button>
  )
}
