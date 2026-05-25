import Link from "next/link"

import {
  EmptyState,
  ErrorNotice,
  PageHeader,
  PageShell,
  Panel,
  StatCard,
  StatusPill,
} from "@/components/layout/page-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { getAdminEventsPageData } from "@/lib/admin/event-queries"
import { getStatus, type AdminEventListItem } from "@/lib/admin/events"
import { CountryFlag, getCountryOption } from "@/lib/countries"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

import { deleteEvent, updateEventStatus } from "./actions"

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

function EventStatusForm({ event }: { event: AdminEventListItem }) {
  const nextStatus = event.status === "published" ? "archived" : "published"

  return (
    <form action={updateEventStatus}>
      <input type="hidden" name="event_id" value={event.id} />
      <input type="hidden" name="status" value={nextStatus} />
      <Button size="sm" type="submit" variant="outline">
        {nextStatus === "published" ? "Publish" : "Archive"}
      </Button>
    </form>
  )
}

function DeleteEventForm({ event }: { event: AdminEventListItem }) {
  return (
    <form action={deleteEvent}>
      <input type="hidden" name="event_id" value={event.id} />
      <Button size="sm" type="submit" variant="destructive">
        Delete
      </Button>
    </form>
  )
}

function StatusFilterTabs({ activeStatus }: { activeStatus: string }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {["all", "published", "archived"].map((status) => (
        <Link
          key={status}
          href={
            status === "all"
              ? "/admin/events"
              : `/admin/events?status=${status}`
          }
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            activeStatus === status &&
              "border-primary bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground"
          )}
        >
          {status}
        </Link>
      ))}
    </div>
  )
}

function AdminEventCard({ event }: { event: AdminEventListItem }) {
  return (
    <Panel className="grid gap-4 lg:grid-cols-[160px_1fr_auto]">
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
          <StatusPill>{event.status}</StatusPill>
          {event.categories?.name ? (
            <StatusPill>{event.categories.name}</StatusPill>
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
          <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
            <CountryFlag
              code={event.country_code}
              className="h-4 w-6 shrink-0 rounded-[2px] shadow-sm ring-1 ring-border/70"
            />
            <span>
              {[
                event.location,
                event.city,
                getCountryOption(event.country_code)?.name,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </span>
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-2 lg:justify-end">
        <Link
          href={`/admin/events/${event.id}/edit`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Edit
        </Link>
        <EventStatusForm event={event} />
        <DeleteEventForm event={event} />
      </div>
    </Panel>
  )
}

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const params = await searchParams
  const activeStatus = getStatus(params.status ?? "") ?? "all"
  const supabase = await createClient()
  const { archivedEvents, events, publishedEvents } =
    await getAdminEventsPageData({
      status: activeStatus,
      supabase,
    })
  const error = params.error ? errorMessages[params.error] : null

  return (
    <PageShell maxWidth="xl">
      <PageHeader
        backHref="/admin"
        backLabel="Admin"
        title="Events management"
        description="Create, edit, publish, archive, and delete events shown on the public homepage."
        actions={[
          {
            href: "/admin/categories",
            label: "Manage categories",
            variant: "outline",
          },
          {
            href: "/admin/events/new",
            label: "New event",
            variant: "default",
          },
        ]}
      />

      <div className="mt-6">
        <ErrorNotice message={error} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="All events" value={publishedEvents + archivedEvents} />
        <StatCard label="Published" value={publishedEvents} />
        <StatCard label="Archived" value={archivedEvents} />
      </div>

      <StatusFilterTabs activeStatus={activeStatus} />

      <div className="mt-6 grid gap-4">
        {events.length ? (
          events.map((event) => <AdminEventCard key={event.id} event={event} />)
        ) : (
          <EmptyState
            title="No events found"
            description="Create the first event or change the current status filter."
          />
        )}
      </div>
    </PageShell>
  )
}
