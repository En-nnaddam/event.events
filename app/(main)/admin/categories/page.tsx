import Link from "next/link"

import { createClient } from "@/lib/supabase/server"

import { createCategory, deleteCategory, updateCategory } from "./actions"

type AdminCategoriesPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

type CategoryRow = {
  id: string
  name: string
  slug: string
}

const errorMessages: Record<string, string> = {
  category_in_use: "This category is used by events and cannot be deleted.",
  delete_failed: "The category could not be deleted.",
  duplicate_slug: "Another category already uses that slug.",
  missing_category: "The selected category could not be found.",
  missing_fields: "Category name and slug are required.",
  save_failed: "The category could not be saved.",
}

function CategoryCreateForm() {
  return (
    <form action={createCategory} className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">Create category</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add a category that event forms can use.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-medium">
          Name
          <input
            className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
            name="name"
            placeholder="Music"
            required
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center self-end rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          Add
        </button>
      </div>
    </form>
  )
}

function CategoryEditForm({
  category,
  eventCount,
}: {
  category: CategoryRow
  eventCount: number
}) {
  return (
    <article className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm lg:grid-cols-[1fr_auto]">
      <form action={updateCategory} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="category_id" value={category.id} />
        <input type="hidden" name="slug" value={category.slug} />
        <label className="grid gap-2 text-sm font-medium">
          Name
          <input
            className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
            name="name"
            defaultValue={category.name}
            required
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center self-end rounded-md border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          Save
        </button>
      </form>

      <div className="flex flex-wrap items-end gap-3 lg:justify-end">
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {eventCount} {eventCount === 1 ? "event" : "events"}
        </div>
        <form action={deleteCategory}>
          <input type="hidden" name="category_id" value={category.id} />
          <button
            type="submit"
            disabled={eventCount > 0}
            className="inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/20 disabled:pointer-events-none disabled:opacity-45"
          >
            Delete
          </button>
        </form>
      </div>
    </article>
  )
}

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const [{ data: categories }, { data: eventCategoryRows }] = await Promise.all([
    supabase.from("categories").select("id,name,slug").order("name", { ascending: true }).returns<CategoryRow[]>(),
    supabase.from("events").select("category_id").returns<Array<{ category_id: string }>>(),
  ])
  const error = params.error ? errorMessages[params.error] : null
  const eventCounts = new Map<string, number>()

  eventCategoryRows?.forEach((row) => {
    eventCounts.set(row.category_id, (eventCounts.get(row.category_id) ?? 0) + 1)
  })

  return (
    <main className="min-h-svh bg-background p-6">
        <section className="mx-auto max-w-5xl py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Admin
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Categories management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage the category list used by event creation and public event cards.
            </p>
          </div>

          <Link
            href="/admin/events"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            Manage events
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          <CategoryCreateForm />
        </div>

        <div className="mt-6 grid gap-4">
          {categories?.length ? (
            categories.map((category) => (
              <CategoryEditForm
                key={category.id}
                category={category}
                eventCount={eventCounts.get(category.id) ?? 0}
              />
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card px-5 py-12 text-center shadow-sm">
              <h2 className="text-lg font-semibold tracking-normal">No categories yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create a category before adding events.
              </p>
            </div>
          )}
        </div>
        </section>
    </main>
  )
}
