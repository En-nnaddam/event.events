import { CenteredPageShell, ErrorNotice } from "@/components/layout/page-shell"

import { AuthForm } from "./auth-form"

type AuthPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<string, string> = {
  account_unavailable: "This account is not available.",
  callback_failed: "Google sign-in failed. Please try again.",
  google_start_failed: "Could not start Google sign-in.",
  missing_code: "The sign-in callback was missing a code.",
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams
  const error = params.error ? errorMessages[params.error] : null

  return (
    <CenteredPageShell>
      <div className="grid w-full max-w-md gap-4">
        <ErrorNotice message={error} />
        <AuthForm />
      </div>
    </CenteredPageShell>
  )
}
