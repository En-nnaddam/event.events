import {
  CenteredPageShell,
  ErrorNotice,
  Panel,
} from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Field, fieldControlClassName } from "@/components/ui/form-field"

import { adminLogin } from "./actions"

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams
  const error = params.error ? errorMessages[params.error] : null

  return (
    <CenteredPageShell>
      <Panel className="w-full max-w-sm p-5">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-normal">
            Admin login
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your admin email and password.
          </p>
        </div>

        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>

        <form action={adminLogin} className="grid gap-4">
          <Field label="Email">
            <input
              className={fieldControlClassName}
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <input
              className={fieldControlClassName}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <Button size="lg" type="submit">
            Sign in
          </Button>
        </form>
      </Panel>
    </CenteredPageShell>
  )
}
