import { UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"

type AuthAvatarProps = {
  avatarUrl: string | null
  fullName: string | null
  isAdmin?: boolean
  size?: "sm" | "md" | "lg"
}

function getInitials(name: string | null) {
  const words = name?.trim().split(/\s+/).filter(Boolean)

  if (!words?.length) {
    return null
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
}

const avatarSizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
}

const iconSizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

export function AuthAvatar({
  avatarUrl,
  fullName,
  isAdmin = false,
  size = "sm",
}: AuthAvatarProps) {
  const initials = getInitials(fullName)

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted font-semibold text-muted-foreground",
        avatarSizes[size],
        isAdmin && "border-primary/35 bg-primary text-primary-foreground"
      )}
      aria-hidden="true"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Provider avatar domains are intentionally not constrained to next/image remotePatterns.
        <img
          src={avatarUrl}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : initials ? (
        initials
      ) : (
        <HugeiconsIcon
          icon={UserIcon}
          strokeWidth={2}
          className={iconSizes[size]}
        />
      )}
    </span>
  )
}
