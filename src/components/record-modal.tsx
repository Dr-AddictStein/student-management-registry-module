"use client"

import { useEffect, useId, useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RecordModal({
  title,
  trigger,
  appearance = "add",
  children,
}: {
  title: string
  trigger: string
  appearance?: "add" | "edit"
  children: React.ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <>
      <Button
        type="button"
        variant={appearance === "edit" ? "outline" : "default"}
        size={appearance === "edit" ? "sm" : "default"}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(52rem,calc(100%-2rem))] max-h-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-black/50"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-popover px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>
        <div className="px-5 py-4">{open ? children : null}</div>
      </dialog>
    </>
  )
}
