import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PageShellProps = {
  children: React.ReactNode
  className?: string
  maxWidth?: "md" | "lg" | "xl"
}

const maxWidthClassName = {
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
}

export function PageShell({
  children,
  className,
  maxWidth = "lg",
}: PageShellProps) {
  return (
    <main className="min-h-svh bg-background p-6">
      <section
        className={cn("mx-auto py-10", maxWidthClassName[maxWidth], className)}
      >
        {children}
      </section>
    </main>
  )
}

export function CenteredPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      {children}
    </main>
  )
}

type PageHeaderAction = {
  href: string
  label: string
  variant?: "default" | "outline"
}

type PageHeaderProps = {
  actions?: PageHeaderAction[]
  backHref?: string
  backLabel?: string
  children?: React.ReactNode
  description?: string
  eyebrow?: string
  title: string
}

export function PageHeader({
  actions = [],
  backHref,
  backLabel,
  children,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {backHref && backLabel ? (
          <Link
            href={backHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {backLabel}
          </Link>
        ) : eyebrow ? (
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children}
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={buttonVariants({
                size: "lg",
                variant: action.variant ?? "outline",
              })}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

type PanelProps = {
  children: React.ReactNode
  className?: string
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  description,
  title,
}: {
  description?: string
  title: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: React.ReactNode
  description: string
  title: string
}) {
  return (
    <Panel className="px-5 py-12 text-center">
      <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Panel>
  )
}

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Panel>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Panel>
  )
}

export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
      {children}
    </span>
  )
}

export function SubmitButton({
  children,
  pendingLabel = "Working...",
  processing,
}: {
  children: React.ReactNode
  pendingLabel?: string
  processing?: boolean
}) {
  return (
    <Button size="lg" type="submit" disabled={processing}>
      {processing ? pendingLabel : children}
    </Button>
  )
}
