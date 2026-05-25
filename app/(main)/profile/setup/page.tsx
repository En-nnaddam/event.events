import { redirect } from "next/navigation"

import {
  CenteredPageShell,
  ErrorNotice,
  Panel,
} from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Field, fieldControlClassName } from "@/components/ui/form-field"
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

export default async function ProfileSetupPage({
  searchParams,
}: ProfileSetupPageProps) {
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
    <CenteredPageShell>
      <div className="grid w-full max-w-md gap-4">
        <ErrorNotice message={error} />

        <Panel className="p-5">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-normal">
              Complete your profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your name before continuing.
            </p>
          </div>

          <form action={completeProfile} className="grid gap-4">
            <Field label="Full name">
              <input
                className={fieldControlClassName}
                name="full_name"
                autoComplete="name"
                defaultValue={suggestedName}
                required
              />
            </Field>
            <Button size="lg" type="submit">
              Continue
            </Button>
          </form>
        </Panel>
      </div>
    </CenteredPageShell>
  )
}
