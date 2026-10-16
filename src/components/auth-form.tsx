"use client"

import Link from "next/link"
import { useActionState } from "react"
import { login, register, type AuthState } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ProgrammeOption = {
  id: string
  code: string
  name: string
  fee: string
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null as AuthState)

  return (
    <form action={action} className="space-y-4">
      <AuthError message={state?.error} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-muted-foreground">
        New student?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm({ programmes }: { programmes: ProgrammeOption[] }) {
  const [state, action, pending] = useActionState(register, null as AuthState)

  return (
    <form action={action} className="space-y-4">
      <AuthError message={state?.error} />
      <Field label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
      </div>
      <Field label="Date of birth" htmlFor="dateOfBirth">
        <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
      </Field>
      <Field label="Programme" htmlFor="programmeId">
        <select
          id="programmeId"
          name="programmeId"
          required
          defaultValue=""
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Choose a programme
          </option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.name} ({programme.code}) — {programme.fee}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Academic year" htmlFor="academicYear">
        <Input
          id="academicYear"
          name="academicYear"
          placeholder="2025/26"
          required
        />
      </Field>
      <p className="text-sm text-muted-foreground">
        A new account is enrolled. The registry issues the student ID and copies the programme fee.
      </p>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already enrolled?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

function AuthError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}
