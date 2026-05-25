import { cn } from "@/lib/utils"

export const fieldControlClassName =
  "min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"

export function Field({
  children,
  className,
  label,
  required,
}: {
  children: React.ReactNode
  className?: string
  label: string
  required?: boolean
}) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium", className)}>
      <span>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  )
}
