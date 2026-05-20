"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

import { startGoogleAuth } from "./actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Connecting..." : "Continue with Google"}
    </Button>
  )
}

export function AuthForm() {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Continue with Google to use your account.</p>
      </div>

      <form action={startGoogleAuth} className="grid gap-4">
        <SubmitButton />
      </form>
    </div>
  )
}
