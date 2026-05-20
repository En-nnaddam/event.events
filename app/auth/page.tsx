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
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-md gap-4">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <AuthForm />
      </div>
    </main>
  )
}
