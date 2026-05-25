import { notFound, redirect } from "next/navigation"

import { EventForm } from "@/components/admin/event-form"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { getCategoryOptions, getEventForForm } from "@/lib/admin/event-queries"
import { createClient } from "@/lib/supabase/server"

import { cleanupEventImages, updateEvent } from "../../actions"

type EditEventPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    error?: string
  }>
}

export default async function EditEventPage({
  params,
  searchParams,
}: EditEventPageProps) {
  const [{ id }, queryParams] = await Promise.all([params, searchParams])
  const supabase = await createClient()
  const [categories, event] = await Promise.all([
    getCategoryOptions(supabase),
    getEventForForm(supabase, id),
  ])

  if (!event) {
    notFound()
  }

  if (!categories.length) {
    redirect("/admin/events?error=missing_categories")
  }

  return (
    <PageShell maxWidth="md">
      <div className="mb-6">
        <PageHeader
          backHref="/admin/events"
          backLabel="Events management"
          title="Edit event"
          description="Update event details, images, status, and contact actions."
        />
      </div>

      <EventForm
        action={updateEvent.bind(null, event.id)}
        categories={categories}
        cleanupAction={cleanupEventImages}
        event={event}
        error={queryParams.error}
      />
    </PageShell>
  )
}
