import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { EventForm } from "@/components/admin/event-form"
import type { CategoryOption, EventFormEvent } from "@/lib/admin/events"
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

  const [{ data: categories }, { data: event }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name")
      .order("name", { ascending: true })
      .returns<CategoryOption[]>(),
    supabase
      .from("events")
      .select(
        `
          id,
          category_id,
          title,
          description,
          city,
          country_code,
          location,
          starts_at,
          ends_at,
          cover_image_url,
          images,
          cta_type,
          cta_url,
          cta_phone
        `
      )
      .eq("id", id)
      .maybeSingle<EventFormEvent>(),
  ])

  if (!event) {
    notFound()
  }

  if (!categories?.length) {
    redirect("/admin/events?error=missing_categories")
  }

  return (
    <main className="min-h-svh bg-background p-6">
      <section className="mx-auto max-w-4xl py-10">
        <div className="mb-6">
          <Link
            href="/admin/events"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Events management
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Edit event
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Update event details, images, status, and contact actions.
          </p>
        </div>

        <EventForm
          action={updateEvent.bind(null, event.id)}
          categories={categories}
          cleanupAction={cleanupEventImages}
          event={event}
          error={queryParams.error}
        />
      </section>
    </main>
  )
}
