import type { SupabaseClient } from "@supabase/supabase-js"

export type CategoryRow = {
  id: string
  name: string
  slug: string
}

export type CategoryWithEventCount = CategoryRow & {
  eventCount: number
}

export async function getCategoriesWithEventCounts(supabase: SupabaseClient) {
  const [{ data: categories }, { data: eventCategoryRows }] = await Promise.all(
    [
      supabase
        .from("categories")
        .select("id,name,slug")
        .order("name", { ascending: true })
        .returns<CategoryRow[]>(),
      supabase
        .from("events")
        .select("category_id")
        .eq("status", "published")
        .returns<Array<{ category_id: string }>>(),
    ]
  )
  const eventCounts = new Map<string, number>()

  eventCategoryRows?.forEach((row) => {
    eventCounts.set(
      row.category_id,
      (eventCounts.get(row.category_id) ?? 0) + 1
    )
  })

  return (categories ?? []).map((category) => ({
    ...category,
    eventCount: eventCounts.get(category.id) ?? 0,
  }))
}
