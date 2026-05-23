import Link from "next/link"

import { createClient } from "@/lib/supabase/server"

import { deleteEvent, updateEventStatus } from "./actions"
import type { AdminEventListItem } from "@/lib/admin/events"

type AdminEventsPageProps = {
  searchParams: Promise<{
    error?: string
    status?: string
  }>
}

const errorMessages: Record<string, string> = {
  delete_failed: "The event could not be deleted.",
  invalid_status: "The selected status is invalid.",
  missing_categories: "Add at least one category before creating events.",
  missing_event: "The selected event could not be found.",
  status_failed: "The event status could not be updated.",
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
      {status}
    </span>
  )
}

function EventStatusForm({ event }: { event: AdminEventListItem }) {
  const nextStatus = event.status === "published" ? "archived" : "published"

  return (
    <form action={updateEventStatus}>
      <input type="hidden" name="event_id" value={event.id} />
      <input type="hidden" name="status" value={nextStatus} />
      <button
        type="submit"
        className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        {nextStatus === "published" ? "Publish" : "Archive"}
      </button>
    </form>
  )
}

function DeleteEventForm({ event }: { event: AdminEventListItem }) {
  return (
    <form action={deleteEvent}>
      <input type="hidden" name="event_id" value={event.id} />
      <button
        type="submit"
        className="inline-flex h-8 items-center justify-center rounded-md border border-destructive/30 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-destructive/20 focus-visible:outline-none"
      >
        Delete
      </button>
    </form>
  )
}

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const params = await searchParams
  const activeStatus =
    params.status === "published" || params.status === "archived"
      ? params.status
      : "all"
  const supabase = await createClient()

  let query = supabase
    .from("events")
    .select(
      `
        id,
        title,
        description,
        city,
        location,
        starts_at,
        cover_image_url,
        status,
        categories (
          name
        )
      `
    )
    .order("created_at", { ascending: false })

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus)
  }

  const [
    { data: events },
    { count: publishedEvents },
    { count: archivedEvents },
  ] = await Promise.all([
    query.returns<AdminEventListItem[]>(),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "archived"),
  ])

  const error = params.error ? errorMessages[params.error] : null

  return (
    <main className="min-h-svh bg-background p-6">
      <section className="mx-auto max-w-6xl py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Events management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create, edit, publish, archive, and delete events shown on the
              public homepage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/categories"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              Manage categories
            </Link>
            <Link
              href="/admin/events/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              New event
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">All events</p>
            <p className="mt-2 text-3xl font-semibold">
              {(publishedEvents ?? 0) + (archivedEvents ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="mt-2 text-3xl font-semibold">
              {publishedEvents ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Archived</p>
            <p className="mt-2 text-3xl font-semibold">{archivedEvents ?? 0}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["all", "published", "archived"].map((status) => (
            <Link
              key={status}
              href={
                status === "all"
                  ? "/admin/events"
                  : `/admin/events?status=${status}`
              }
              className={`inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium transition ${
                activeStatus === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {status}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {events?.length ? (
            events.map((event) => (
              <article
                key={event.id}
                className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm lg:grid-cols-[160px_1fr_auto]"
              >
                <div
                  className="min-h-32 rounded-md bg-muted bg-cover bg-center"
                  style={
                    event.cover_image_url
                      ? { backgroundImage: `url("${event.cover_image_url}")` }
                      : undefined
                  }
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={event.status} />
                    {event.categories?.name ? (
                      <StatusPill status={event.categories.name} />
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {formatEventDate(event.starts_at)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-normal">
                    {event.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {event.description || "No description added."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.location
                      ? `${event.location}, ${event.city}`
                      : event.city}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    Edit
                  </Link>
                  <EventStatusForm event={event} />
                  <DeleteEventForm event={event} />
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card px-5 py-12 text-center shadow-sm">
              <h2 className="text-lg font-semibold tracking-normal">
                No events found
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create the first event or change the current status filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
