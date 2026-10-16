import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        That address is not part of the registry.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        Back to the registry
      </Link>
    </div>
  )
}
