import { Suspense } from "react"

import { EventsFilterBar } from "@/components/events/events-filter-bar"
import { EventsHero } from "@/components/events/events-hero"
import { EventsInfiniteList } from "@/components/events/events-infinite-list"
import type { EventFilterCategory } from "@/lib/events/filters"
import { createClient } from "@/lib/supabase/server"

function EventsFeedSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}

export default async function Page() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,slug")
    .order("name", { ascending: true })
    .returns<EventFilterCategory[]>()

  return (
    <main className="min-h-svh bg-background">
      <EventsHero />

      <section
        id="events"
        className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Latest published events
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-normal">
              Events feed
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Each event opens right here with dates, place, images, contact
            details, and action links.
          </p>
        </div>

        <Suspense fallback={<EventsFeedSkeleton />}>
          <EventsFilterBar categories={categories ?? []} />
          <EventsInfiniteList categories={categories ?? []} />
        </Suspense>
      </section>
    </main>
  )
}
