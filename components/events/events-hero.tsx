export function EventsHero() {
  return (
    <section className="border-b border-border/80 bg-[radial-gradient(circle_at_18%_30%,color-mix(in_oklch,var(--primary)_10%,transparent)_0%,transparent_30%),radial-gradient(circle_at_82%_12%,color-mix(in_oklch,var(--accent-warm)_14%,transparent)_0%,transparent_28%),linear-gradient(135deg,color-mix(in_oklch,var(--background)_94%,white)_0%,color-mix(in_oklch,var(--accent)_20%,white)_56%,color-mix(in_oklch,var(--muted)_54%,white)_100%)] dark:bg-[radial-gradient(circle_at_80%_18%,color-mix(in_oklch,var(--accent-warm)_16%,transparent)_0%,transparent_30%),radial-gradient(circle_at_16%_18%,color-mix(in_oklch,var(--primary)_18%,transparent)_0%,transparent_36%),linear-gradient(135deg,var(--background)_0%,color-mix(in_oklch,var(--muted)_82%,var(--background))_58%,color-mix(in_oklch,var(--primary)_12%,var(--background))_100%)]">
      <div className="mx-auto flex min-h-[72svh] max-w-6xl items-center px-5 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary dark:text-accent-warm">
            Event.Events
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">
            Discover events without waiting at the door.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Browse published events, see the important details in one place, and contact the organizer directly when an event fits your plans.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#events"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 dark:shadow-lg"
            >
              Browse events
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
