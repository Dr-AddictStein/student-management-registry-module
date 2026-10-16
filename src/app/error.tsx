"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {error.message || "The registry could not load this page."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        Try again
      </button>
    </div>
  )
}
