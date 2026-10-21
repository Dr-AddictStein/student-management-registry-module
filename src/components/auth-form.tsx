"use client"

import Link from "next/link"
import { startTransition, useActionState, useEffect, useRef } from "react"
import { login, register, type AuthState } from "@/lib/auth-actions"
import { Field, FormError, NativeSelect } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"

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
      <FormError message={state?.error} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput
          id="password"
          name="password"
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
  const [state, submit, pending] = useActionState(register, null as AuthState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const form = formRef.current
    if (!form || !state?.clear?.length) return

    for (const name of state.clear) {
      const field = form.elements.namedItem(name)
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        field.value = ""
      }
    }
  }, [state])

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        startTransition(() => {
          submit(formData)
        })
      }}
    >
      <FormError message={state?.error} />
      <Field label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword">
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
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
        <NativeSelect id="programmeId" name="programmeId" required defaultValue="">
          <option value="">Choose a programme</option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.name} ({programme.code}) — {programme.fee}
            </option>
          ))}
        </NativeSelect>
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
