import type { SupabaseClient } from "@supabase/supabase-js"

import {
  ADMIN_EVENT_LIST_COLUMNS,
  CATEGORY_OPTION_COLUMNS,
  EVENT_FORM_COLUMNS,
  EVENT_FILTER_CATEGORY_COLUMNS,
  PUBLIC_EVENT_COLUMNS,
  type AdminEventListItem,
  type AdminRecentEvent,
  type CategoryOption,
  type EventFormEvent,
  type EventStatus,
} from "@/lib/admin/events"
import type { EventFilterCategory } from "@/lib/events/filters"
import type { EventFeedItem } from "@/lib/events/types"

export async function getCategoryOptions(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_OPTION_COLUMNS)
    .order("name", { ascending: true })
    .returns<CategoryOption[]>()

  return data ?? []
}

export async function getEventFilterCategories(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("categories")
    .select(EVENT_FILTER_CATEGORY_COLUMNS)
    .order("name", { ascending: true })
    .returns<EventFilterCategory[]>()

  return data ?? []
}

export async function getUpcomingPublishedEvents(
  supabase: SupabaseClient,
  limit = 4,
  now = new Date()
) {
  const nowIso = now.toISOString()
  const { data } = await supabase
    .from("events")
    .select(PUBLIC_EVENT_COLUMNS)
    .eq("status", "published")
    .or(`ends_at.gte.${nowIso},and(ends_at.is.null,starts_at.gte.${nowIso})`)
    .order("starts_at", { ascending: true })
    .limit(limit)
    .returns<EventFeedItem[]>()

  return data ?? []
}

export async function getPublishedEventBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const { data } = await supabase
    .from("events")
    .select(PUBLIC_EVENT_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle<EventFeedItem>()

  return data
}

export async function getEventForForm(
  supabase: SupabaseClient,
  eventId: string
) {
  const { data } = await supabase
    .from("events")
    .select(EVENT_FORM_COLUMNS)
    .eq("id", eventId)
    .maybeSingle<EventFormEvent>()

  return data
}

async function getAdminEventStatusCounts(supabase: SupabaseClient) {
  const [{ count: publishedEvents }, { count: archivedEvents }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "archived"),
    ])

  return {
    archivedEvents: archivedEvents ?? 0,
    publishedEvents: publishedEvents ?? 0,
  }
}

export async function getAdminEventsPageData({
  status,
  supabase,
}: {
  status: EventStatus | "all"
  supabase: SupabaseClient
}) {
  let query = supabase
    .from("events")
    .select(ADMIN_EVENT_LIST_COLUMNS)
    .order("created_at", { ascending: false })

  if (status !== "all") {
    query = query.eq("status", status)
  }

  const [{ data: events }, eventCounts] = await Promise.all([
    query.returns<AdminEventListItem[]>(),
    getAdminEventStatusCounts(supabase),
  ])

  return {
    events: events ?? [],
    ...eventCounts,
  }
}

export async function getAdminDashboardData(supabase: SupabaseClient) {
  const [eventCounts, { data: recentEvents }] = await Promise.all([
    getAdminEventStatusCounts(supabase),
    supabase
      .from("events")
      .select("id,title,status,city,starts_at")
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<AdminRecentEvent[]>(),
  ])

  return {
    recentEvents: recentEvents ?? [],
    ...eventCounts,
  }
}
