import Link from "next/link"
import { UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { LogoutForm } from "@/components/auth/logout-form"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentAuth } from "@/lib/auth/current"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

function getInitials(name: string | null) {
  const words = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words?.length) {
    return null
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
}

export async function AppHeader() {
  const supabase = await createClient()
  const currentAuth = await getCurrentAuth(supabase)
  const initials = currentAuth.status === "signed_in" ? getInitials(currentAuth.fullName) : null

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
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground",
                    currentAuth.role === "admin" &&
                      "border-primary/35 bg-primary text-primary-foreground"
                  )}
                  aria-hidden="true"
                >
                  {currentAuth.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Provider avatar domains are intentionally not constrained to next/image remotePatterns.
                    <img
                      src={currentAuth.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : initials ? (
                    initials
                  ) : (
                    <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
                  )}
                </span>
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
