import Link from "next/link"

import { AuthAvatar } from "@/components/auth/auth-avatar"
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
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto min-h-11 justify-start gap-3 rounded-4xl px-2.5 py-1.5 pr-3",
                  currentAuth.role === "admin" &&
                    "border-primary/35 bg-primary/5 ring-1 ring-primary/15 hover:bg-primary/10"
                )}
              >
                <AuthAvatar
                  avatarUrl={currentAuth.avatarUrl}
                  fullName={currentAuth.fullName}
                  isAdmin={currentAuth.role === "admin"}
                />
                <span className="flex min-w-0 flex-col items-start leading-tight">
                  <span className="flex max-w-40 items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {currentAuth.fullName?.trim() || "Signed in"}
                    </span>
                    {currentAuth.role === "admin" ? (
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-primary">
                        Admin
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {currentAuth.role === "admin" ? "Admin session" : "User session"}
                  </span>
                </span>
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
