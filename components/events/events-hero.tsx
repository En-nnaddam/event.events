import {
  ActivitySparkIcon,
  ArrowRight01Icon,
  Calendar01Icon,
  Location01Icon,
  Mail01Icon,
  TicketStarIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function EventsHero() {
  return (
    <section className="event-hero-pulse relative overflow-hidden border-b border-border/80 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--background)_96%,white)_0%,color-mix(in_oklch,var(--accent)_26%,white)_46%,color-mix(in_oklch,var(--muted)_60%,white)_100%)] dark:bg-[linear-gradient(135deg,var(--background)_0%,color-mix(in_oklch,var(--muted)_78%,var(--background))_50%,color-mix(in_oklch,var(--primary)_18%,var(--background))_100%)]">
      <div className="event-hero-grid" aria-hidden="true" />
      <div
        className="event-hero-sweep event-hero-sweep-one"
        aria-hidden="true"
      />
      <div
        className="event-hero-sweep event-hero-sweep-two"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid min-h-[68svh] max-w-6xl items-center gap-9 px-5 py-11 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.86fr)] lg:px-8 lg:py-14">
        <div className="max-w-3xl lg:pt-1">
          <p className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary shadow-sm shadow-primary/10 dark:border-accent-warm/20 dark:bg-accent-warm/10 dark:text-accent-warm">
            <span className="event-hero-live-dot" aria-hidden="true" />
            Event.Events live pulse
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl leading-[1.04] font-semibold tracking-normal text-balance text-foreground sm:text-5xl sm:leading-[1.02] lg:text-6xl">
            Find your next{" "}
            <span className="event-hero-gradient-text inline-block">vibe</span>{" "}
            in seconds.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            From concerts to workshops and weekend spots — discover what&apos;s
            happening near you and plan faster.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-sm font-medium">
            {["Tonight", "This weekend", "Near you", "New drops"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full border border-border/70 bg-background/55 px-3 py-1.5 text-foreground/90 shadow-sm shadow-primary/5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10 dark:bg-white/5"
                >
                  {label}
                </span>
              )
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#events"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              See what&apos;s on
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-4 transition group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[28rem] lg:max-w-none">
          <div className="event-hero-float event-hero-chip event-hero-chip-music">
            Music
          </div>
          <div className="event-hero-float event-hero-chip event-hero-chip-workshop">
            Workshops
          </div>
          <div className="event-hero-float event-hero-chip event-hero-chip-nightlife">
            Nightlife
          </div>
          <div className="event-hero-float event-hero-chip event-hero-chip-culture">
            Culture
          </div>

          <div className="event-hero-preview relative overflow-hidden rounded-lg border border-border/80 bg-card/72 p-4 shadow-2xl shadow-primary/20 backdrop-blur-2xl dark:border-white/15 dark:bg-card/68">
            <div className="event-hero-preview-media relative overflow-hidden rounded-md border border-white/15 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_88%,black)_0%,color-mix(in_oklch,var(--accent-warm)_82%,var(--primary))_52%,color-mix(in_oklch,var(--chart-3)_74%,black)_100%)]">
              <div className="event-hero-stage-lines" aria-hidden="true" />
              <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                <HugeiconsIcon
                  icon={ActivitySparkIcon}
                  strokeWidth={2}
                  className="size-3.5"
                />
                Fresh pick
              </div>
              <div className="absolute inset-x-5 bottom-5 grid gap-2 text-white">
                <span className="w-fit rounded-full bg-black/35 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                  Tonight
                </span>
                <p className="max-w-64 text-2xl leading-tight font-semibold">
                  Rooftop rhythm session
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="rounded-full border border-accent-warm/30 bg-accent px-3 py-1 text-accent-foreground shadow-sm shadow-accent-warm/10 dark:bg-accent-warm/15 dark:text-accent-warm">
                  Featured
                </span>
                <span className="rounded-full border border-border/70 bg-secondary px-3 py-1 text-secondary-foreground dark:bg-white/5">
                  New events
                </span>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3 rounded-md border border-border/70 bg-background/70 p-3 shadow-sm shadow-primary/5 dark:bg-white/5">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-accent-warm/10 dark:text-accent-warm">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Fri, 9:30 PM</p>
                    <p className="text-muted-foreground">Doors open early</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-md border border-border/70 bg-background/70 p-3 shadow-sm shadow-primary/5 dark:bg-white/5">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-accent-warm/10 dark:text-accent-warm">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      Casablanca, MA
                    </p>
                    <p className="text-muted-foreground">Near you this week</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border/70 bg-surface-raised p-3">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    strokeWidth={2}
                    className="mb-2 size-4 text-primary dark:text-accent-warm"
                  />
                  <p className="leading-5 font-medium text-foreground">
                    Direct organizer contact
                  </p>
                </div>
                <div className="rounded-md border border-border/70 bg-surface-raised p-3">
                  <HugeiconsIcon
                    icon={TicketStarIcon}
                    strokeWidth={2}
                    className="mb-2 size-4 text-primary dark:text-accent-warm"
                  />
                  <p className="leading-5 font-medium text-foreground">
                    Details before you go
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
