import Link from "next/link"

import { LogoutForm } from "@/components/auth/logout-form"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentAuth } from "@/lib/auth/current"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

export async function AppHeader() {
  const supabase = await createClient()
  const currentAuth = await getCurrentAuth(supabase)

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold tracking-normal text-foreground">
          Event.Events
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {currentAuth.status === "signed_in" ? (
            <>
              <Link
                href={currentAuth.destination}
                className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              >
                {currentAuth.role === "admin" ? "Admin session" : "User session"}
              </Link>
              <LogoutForm />
            </>
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
