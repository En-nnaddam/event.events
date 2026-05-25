import { redirect } from "next/navigation"

import { EventForm } from "@/components/admin/event-form"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { getCategoryOptions } from "@/lib/admin/event-queries"
import { createClient } from "@/lib/supabase/server"

import { cleanupEventImages, createEvent, updateEventImages } from "../actions"

type NewEventPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function NewEventPage({
  searchParams,
}: NewEventPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const categories = await getCategoryOptions(supabase)

  if (!categories.length) {
    redirect("/admin/events?error=missing_categories")
  }

  return (
    <PageShell maxWidth="md">
      <div className="mb-6">
        <PageHeader
          backHref="/admin/events"
          backLabel="Events management"
          title="Create event"
          description="Add a public or archived event using the existing category list."
        />
      </div>

      <EventForm
        action={createEvent}
        categories={categories}
        cleanupAction={cleanupEventImages}
        error={params.error}
        imageAction={updateEventImages}
      />
    </PageShell>
  )
}
