import Link from "next/link"
import { cn } from "@/lib/utils"

const sections = [
  { id: "assessments", href: "/assessments", label: "Assessments" },
  { id: "submissions", href: "/assessments/submissions", label: "Submissions" },
] as const

export function AssessmentSections({ current }: { current: (typeof sections)[number]["id"] }) {
  return (
    <nav aria-label="Assessment sections" className="mb-6 flex gap-6 border-b">
      {sections.map((section) => {
        const active = section.id === current
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2 text-sm font-medium",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}
