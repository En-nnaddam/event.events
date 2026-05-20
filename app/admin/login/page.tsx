import { Button } from "@/components/ui/button"

import { adminLogin } from "./actions"

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams
  const error = params.error ? errorMessages[params.error] : null

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-normal">Admin login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your admin email and password.</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form action={adminLogin} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <Button size="lg" type="submit">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  )
}
