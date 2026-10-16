import type { Metadata } from "next"
import { LoginForm } from "@/components/auth-form"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 mb-6 text-sm leading-6 text-muted-foreground">
        Students use the email and password from registration. Registry staff use the fixed desk account.
      </p>
      <LoginForm />
    </>
  )
}
