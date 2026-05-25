import { Button } from "@/components/ui/button"
import { Field, fieldControlClassName } from "@/components/ui/form-field"
import {
  EmptyState,
  ErrorNotice,
  PageHeader,
  PageShell,
  Panel,
  PanelHeader,
} from "@/components/layout/page-shell"
import {
  getCategoriesWithEventCounts,
  type CategoryWithEventCount,
} from "@/lib/admin/categories"
import { createClient } from "@/lib/supabase/server"

import { createCategory, deleteCategory, updateCategory } from "./actions"

type AdminCategoriesPageProps = {
  searchParams: Promise<{
    error?: string
  }>
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
    <Panel className="grid gap-4">
      <PanelHeader
        title="Create category"
        description="Add a category that event forms can use."
      />

      <form
        action={createCategory}
        className="grid gap-3 sm:grid-cols-[1fr_auto]"
      >
        <Field label="Name">
          <input
            className={fieldControlClassName}
            name="name"
            placeholder="Music"
            required
          />
        </Field>
        <Button className="self-end" size="lg" type="submit">
          Add
        </Button>
      </form>
    </Panel>
  )
}

function CategoryEditForm({ category }: { category: CategoryWithEventCount }) {
  return (
    <Panel className="grid gap-4 lg:grid-cols-[1fr_auto]">
      <form
        action={updateCategory}
        className="grid gap-3 sm:grid-cols-[1fr_auto]"
      >
        <input type="hidden" name="category_id" value={category.id} />
        <input type="hidden" name="slug" value={category.slug} />
        <Field label="Name">
          <input
            className={fieldControlClassName}
            name="name"
            defaultValue={category.name}
            required
          />
        </Field>
        <Button className="self-end" size="lg" type="submit" variant="outline">
          Save
        </Button>
      </form>

      <div className="flex flex-wrap items-end gap-3 lg:justify-end">
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {category.eventCount} {category.eventCount === 1 ? "event" : "events"}
        </div>
        <form action={deleteCategory}>
          <input type="hidden" name="category_id" value={category.id} />
          <Button
            size="lg"
            type="submit"
            variant="destructive"
            disabled={category.eventCount > 0}
          >
            Delete
          </Button>
        </form>
      </div>
    </Panel>
  )
}

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const categories = await getCategoriesWithEventCounts(supabase)
  const error = params.error ? errorMessages[params.error] : null

  return (
    <PageShell>
      <PageHeader
        backHref="/admin"
        backLabel="Admin"
        title="Categories management"
        description="Manage the category list used by event creation and public event cards."
        actions={[
          {
            href: "/admin/events",
            label: "Manage events",
            variant: "outline",
          },
        ]}
      />

      <div className="mt-6">
        <ErrorNotice message={error} />
      </div>

      <div className="mt-6">
        <CategoryCreateForm />
      </div>

      <div className="mt-6 grid gap-4">
        {categories.length ? (
          categories.map((category) => (
            <CategoryEditForm key={category.id} category={category} />
          ))
        ) : (
          <EmptyState
            title="No categories yet"
            description="Create a category before adding events."
          />
        )}
      </div>
    </PageShell>
  )
}
