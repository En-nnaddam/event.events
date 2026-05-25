import Link from "next/link"

import {
  PageHeader,
  PageShell,
  Panel,
  StatCard,
} from "@/components/layout/page-shell"
import { getAdminDashboardData } from "@/lib/admin/event-queries"
import { createClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  const supabase = await createClient()
  const { archivedEvents, publishedEvents, recentEvents } =
    await getAdminDashboardData(supabase)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin"
        title="Admin dashboard"
        description="Manage the event catalog that appears on the public homepage."
        actions={[
          {
            href: "/admin/categories",
            label: "Manage categories",
            variant: "outline",
          },
          {
            href: "/admin/events",
            label: "Manage events",
            variant: "default",
          },
        ]}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Published events" value={publishedEvents} />
        <StatCard label="Archived events" value={archivedEvents} />
      </div>

      <Panel className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-normal">
            Recent events
          </h2>
          <Link
            href="/admin/events/new"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            New event
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {recentEvents.length ? (
            recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}/edit`}
                className="grid gap-1 rounded-md border border-border p-3 transition hover:bg-muted"
              >
                <span className="font-medium">{event.title}</span>
                <span className="text-sm text-muted-foreground">
                  {event.status} - {event.city} -{" "}
                  {new Date(event.starts_at).toLocaleDateString()}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No events have been created yet.
            </p>
          )}
        </div>
      </Panel>
    </PageShell>
  )
}
