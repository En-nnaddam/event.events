import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

import { completeProfile } from "./actions"

type ProfileSetupPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<string, string> = {
  missing_fields: "Please enter your full name.",
  save_failed: "Could not save your profile. Please try again.",
}

export default async function ProfileSetupPage({ searchParams }: ProfileSetupPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle<{ role: "user" | "admin"; full_name: string | null }>()

  if (!profile) {
    redirect("/auth?error=account_unavailable")
  }

  if (profile.role === "admin") {
    redirect("/admin")
  }

  if (profile.full_name?.trim()) {
    redirect("/user")
  }

  const params = await searchParams
  const error = params.error ? errorMessages[params.error] : null
  const suggestedName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : ""

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <div className="grid w-full max-w-md gap-4">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-normal">Complete your profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Add your name before continuing.</p>
          </div>

          <form action={completeProfile} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Full name
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                name="full_name"
                autoComplete="name"
                defaultValue={suggestedName}
                required
              />
            </label>
            <Button size="lg" type="submit">
              Continue
            </Button>
          </form>
        </div>
        </div>
    </main>
  )
}
