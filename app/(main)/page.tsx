import { EventsInfiniteList } from "@/components/events/events-infinite-list"

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
        <section className="border-b border-border bg-[linear-gradient(135deg,var(--background)_0%,var(--muted)_62%,color-mix(in_oklch,var(--primary)_12%,var(--background))_100%)]">
          <div className="mx-auto grid min-h-[72svh] max-w-6xl content-center gap-10 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-muted-foreground">Event.Events</p>
              <h1 className="mt-4 text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">
                Discover events without waiting at the door.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Browse published events, see the important details in one place, and contact the organizer directly when an event fits your plans.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#events"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  Browse events
                </a>
              </div>
            </div>

            <aside className="grid gap-3 self-end rounded-lg border border-border bg-card/85 p-4 shadow-sm backdrop-blur">
              <div>
                <p className="text-sm font-medium text-foreground">For admins</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Manage published and archived events from the protected dashboard.
                </p>
              </div>
            </aside>
          </div>
        </section>

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
