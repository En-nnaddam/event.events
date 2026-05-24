import { EventsHero } from "@/components/events/events-hero"
import { EventsInfiniteList } from "@/components/events/events-infinite-list"

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <EventsHero />

      <section id="events" className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Latest published events</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-normal">Events feed</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Each event opens right here with dates, place, images, contact details, and action links.
          </p>
        </div>

        <EventsInfiniteList />
      </section>
    </main>
  )
}
