import Image from "next/image"

export function Logo() {
  return (
    <span className="inline-flex min-h-10 items-end gap-2.5">
      <Image
        src="/logo.webp"
        alt=""
        width={703}
        height={433}
        className="h-9 w-auto shrink-0"
        priority
      />
      <span className="text-base font-semibold tracking-normal text-foreground">
        Event.Events
      </span>
    </span>
  )
}
