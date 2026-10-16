import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { RegistryShell } from "@/components/registry-shell"
import { RoleProvider } from "@/components/role-provider"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "SMS Registry",
    template: "%s · SMS Registry",
  },
  description:
    "Registry module for student enrolment, fees, assessment submission, and results.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RoleProvider>
          <RegistryShell>{children}</RegistryShell>
        </RoleProvider>
      </body>
    </html>
  )
}
