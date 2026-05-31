import Link from "next/link"

import { Logo } from "@/components/layout/logo"
import { buttonVariants } from "@/components/ui/button"

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/discover#events", label: "Discover" },
  { href: "/auth", label: "Login" },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/80 bg-[linear-gradient(180deg,var(--background),var(--surface-raised))] px-5 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="max-w-xl">
            <Link
              href="/"
              className="inline-flex rounded-md focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <Logo />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              A focused place to discover upcoming events by interest, location,
              date, and format.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-[auto_auto] sm:items-start sm:gap-8 md:justify-end">
            <nav aria-label="Footer" className="grid gap-2">
              <p className="text-sm font-semibold tracking-normal">
                Quick links
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 sm:grid sm:gap-2">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            <Link
              href="/discover#events"
              className={buttonVariants({
                size: "lg",
                className: "w-fit",
              })}
            >
              Explore events
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/80 pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} Event.Events. All rights reserved.</p>
          <p>Find what is happening next.</p>
        </div>
      </div>
    </footer>
  )
}
