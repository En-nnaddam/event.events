import { Suspense } from "react"

import { EventsFilterBar } from "@/components/events/events-filter-bar"
import { EventsInfiniteList } from "@/components/events/events-infinite-list"
import { getEventFilterCategories } from "@/lib/admin/event-queries"
import { createClient } from "@/lib/supabase/server"

function EventsFeedSkeleton() {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm shadow-black/5 xl:sticky xl:top-6 xl:self-start">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mt-4 grid gap-3">
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="grid min-w-0 gap-5">
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export default async function DiscoverPage() {
  const supabase = await createClient()
  const categories = await getEventFilterCategories(supabase)

  return (
    <main className="min-h-svh overflow-x-clip bg-background">
      <section
        id="events"
        className="relative mx-auto max-w-[92rem] px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_36%),linear-gradient(180deg,color-mix(in_oklch,var(--accent)_55%,transparent),transparent_74%)]"
          aria-hidden="true"
        />

        <div className="mb-8 grid gap-5 rounded-lg border border-border/70 bg-card/80 p-5 shadow-xl shadow-black/5 backdrop-blur sm:p-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="min-w-0">
            <p className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary dark:border-accent-warm/30 dark:bg-accent-warm/15 dark:text-accent-warm">
              Discover events
            </p>
            <h1 className="mt-4 max-w-4xl text-3xl leading-tight font-semibold tracking-normal text-balance sm:text-4xl lg:text-5xl">
              Find the next room, stage, workshop, or gathering worth showing up
              for.
            </h1>
          </div>
          <div className="grid gap-3 rounded-md bg-surface-raised/75 p-4 ring-1 ring-border/60">
            <p className="text-sm leading-6 text-muted-foreground">
              Search by interest, city, country, category, date, price, or
              format. Start broad, then narrow the feed when something catches
              your eye.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full bg-background px-2.5 py-1 ring-1 ring-border/60">
                Live filters
              </span>
              <span className="rounded-full bg-background px-2.5 py-1 ring-1 ring-border/60">
                Image previews
              </span>
              <span className="rounded-full bg-background px-2.5 py-1 ring-1 ring-border/60">
                Free and paid
              </span>
            </div>
          </div>
        </div>

        <Suspense fallback={<EventsFeedSkeleton />}>
          <div className="grid min-w-0 gap-5 xl:grid-cols-[17rem_minmax(0,1fr)] xl:items-start">
            <EventsFilterBar categories={categories} />
            <EventsInfiniteList categories={categories} />
          </div>
        </Suspense>
      </section>
    </main>
  )
}
