"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { AuthAvatar } from "@/components/auth/auth-avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { CurrentAuth } from "@/lib/auth/current"
import { cn } from "@/lib/utils"

type SignedInAuth = Extract<CurrentAuth, { status: "signed_in" }>

type AuthMenuProps = {
  currentAuth: SignedInAuth
  children: ReactNode
}

export function AuthMenu({ currentAuth, children }: AuthMenuProps) {
  const isAdmin = currentAuth.role === "admin"
  const displayName = currentAuth.fullName?.trim() || "Signed in"
  const sessionLabel = isAdmin ? "Admin session" : "User session"
  const destinationLabel = isAdmin ? "Open dashboard" : "Open profile"

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`${displayName}, ${sessionLabel}`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 gap-2 rounded-4xl px-1.5 pr-2.5",
          isAdmin &&
            "border-primary/30 bg-primary/5 ring-1 ring-primary/10 hover:bg-primary/10"
        )}
      >
        <AuthAvatar
          avatarUrl={currentAuth.avatarUrl}
          fullName={currentAuth.fullName}
          isAdmin={isAdmin}
        />
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(18rem,calc(100vw-2rem))] gap-3 rounded-xl p-3"
      >
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
          <AuthAvatar
            avatarUrl={currentAuth.avatarUrl}
            fullName={currentAuth.fullName}
            isAdmin={isAdmin}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              {isAdmin ? (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary uppercase">
                  Admin
                </span>
              ) : null}
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {sessionLabel}
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <Link
            href={currentAuth.destination}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 justify-start rounded-xl px-3"
            )}
          >
            {destinationLabel}
          </Link>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  )
}
