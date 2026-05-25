import Link from "next/link"

import { AuthMenu } from "@/components/auth/auth-menu"
import { LogoutForm } from "@/components/auth/logout-form"
import { Logo } from "@/components/layout/logo"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentAuth } from "@/lib/auth/current"
import { createClient } from "@/lib/supabase/server"

export async function Header() {
  const supabase = await createClient()
  const currentAuth = await getCurrentAuth(supabase)

  return (
    <header className="border-b border-border/80 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:flex-row sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {currentAuth.status === "signed_in" ? (
            <AuthMenu currentAuth={currentAuth}>
              <LogoutForm buttonClassName="h-9 w-full justify-start rounded-xl px-3" />
            </AuthMenu>
          ) : (
            <Link
              href="/auth"
              className={buttonVariants({ variant: "outline" })}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
