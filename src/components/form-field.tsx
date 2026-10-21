import { cn } from "cn"

const fieldClass = "flex min-w-0 flex-col items-stretch gap-1.5 text-left whitespace-normal"

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  if (htmlFor) {
    return (
      <div className={cn(fieldClass, className)}>
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {children}
      </div>
    )
  }

  return (
    <label className={cn(fieldClass, className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-full" role="alert">
      {message}
    </p>
  )
}

export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  )
}
