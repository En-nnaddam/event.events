import Link from "next/link"

import { AuthMenu } from "@/components/auth/auth-menu"
import { LogoutForm } from "@/components/auth/logout-form"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentAuth } from "@/lib/auth/current"
import { createClient } from "@/lib/supabase/server"

export async function AppHeader() {
  const supabase = await createClient()
  const currentAuth = await getCurrentAuth(supabase)

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex min-h-16 max-w-6xl gap-3 px-5 py-3 sm:flex-row items-center justify-between sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold tracking-normal text-foreground">
          Event.Events
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {currentAuth.status === "signed_in" ? (
            <AuthMenu currentAuth={currentAuth}>
              <LogoutForm buttonClassName="h-9 w-full justify-start rounded-xl px-3" />
            </AuthMenu>
          ) : (
            <Link href="/auth" className={buttonVariants({ variant: "outline" })}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
