import Link from "next/link"
import { redirect } from "next/navigation"

import { EventForm } from "@/components/admin/event-form"
import type { CategoryOption } from "@/lib/admin/events"
import { createClient } from "@/lib/supabase/server"

import { cleanupEventImages, createEvent } from "../actions"

type NewEventPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function NewEventPage({ searchParams }: NewEventPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,slug")
    .order("name", { ascending: true })
    .returns<CategoryOption[]>()

  if (!categories?.length) {
    redirect("/admin/events?error=missing_categories")
  }

  return (
    <main className="min-h-svh bg-background p-6">
        <section className="mx-auto max-w-4xl py-10">
        <div className="mb-6">
          <Link href="/admin/events" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Events management
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">Create event</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add a public or archived event using the existing category list.
          </p>
        </div>

        <EventForm action={createEvent} categories={categories} cleanupAction={cleanupEventImages} error={params.error} />
        </section>
    </main>
  )
}
