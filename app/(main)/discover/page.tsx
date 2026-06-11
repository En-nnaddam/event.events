import { Suspense } from "react"

import { EventsFilterBar } from "@/components/events/events-filter-bar"
import { EventsInfiniteList } from "@/components/events/events-infinite-list"
import { getEventFilterCategories } from "@/lib/admin/event-queries"
import { createClient } from "@/lib/supabase/server"

function EventsFeedSkeleton() {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm xl:sticky xl:top-6 xl:self-start">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mt-4 grid gap-3">
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="grid min-w-0 gap-5">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export default async function DiscoverPage() {
  const supabase = await createClient()
  const categories = await getEventFilterCategories(supabase)

  return (
    <main className="min-h-svh bg-background">
      <section
        id="events"
        className="mx-auto max-w-[92rem] px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Discover
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">
              Events feed
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Search by interest, city, country, category, date, price, or format.
          </p>
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
