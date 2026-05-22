import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminPage() {
  const supabase = await createClient()
  const { count: publishedEvents } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")

  const { count: archivedEvents } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "archived")
  const { data: recentEvents } = await supabase
    .from("events")
    .select("id,title,status,city,starts_at")
    .order("created_at", { ascending: false })
    .limit(3)
    .returns<Array<{ id: string; title: string; status: string; city: string; starts_at: string }>>()

  return (
    <main className="min-h-svh bg-background p-6">
      <section className="mx-auto max-w-5xl py-12">
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Admin dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage the event catalog that appears on the public homepage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/events"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              Manage events
            </Link>
            <Link
              href="/admin/categories"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              Manage categories
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Published events</p>
            <p className="mt-2 text-3xl font-semibold">{publishedEvents ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Archived events</p>
            <p className="mt-2 text-3xl font-semibold">{archivedEvents ?? 0}</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-normal">Recent events</h2>
            <Link href="/admin/events/new" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              New event
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {recentEvents?.length ? (
              recentEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}/edit`}
                  className="grid gap-1 rounded-md border border-border p-3 transition hover:bg-muted"
                >
                  <span className="font-medium">{event.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {event.status} - {event.city} - {new Date(event.starts_at).toLocaleDateString()}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No events have been created yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
