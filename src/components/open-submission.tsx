"use client"

import { buttonVariants } from "@/components/ui/button"

export function OpenSubmission({ id }: { id: string }) {
  return (
    <a
      href={`/api/submissions/${id}?view=1`}
      target="_blank"
      rel="noopener"
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Open
    </a>
  )
}
