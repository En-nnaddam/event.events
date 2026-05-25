"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { EventCard } from "@/components/events/event-card"
import {
  useInfiniteQuery,
  type SupabaseQueryHandler,
} from "@/hooks/use-infinite-query"
import {
  PUBLIC_EVENT_COLUMNS,
  PUBLIC_EVENTS_PAGE_SIZE,
} from "@/lib/admin/events"
import {
  getEventFilters,
  getFilterLabel,
  hasEventFilters,
  type EventFilterCategory,
} from "@/lib/events/filters"
import type { EventFeedItem } from "@/lib/events/types"

function EventSkeleton() {
  return (
    <div className="grid gap-5 rounded-lg border border-border bg-card p-4 shadow-sm lg:grid-cols-[minmax(300px,0.55fr)_1fr] lg:p-5">
      <div className="grid gap-3">
        <div className="min-h-72 animate-pulse rounded-lg bg-muted md:min-h-80 lg:min-h-96" />
        <div className="flex gap-3 overflow-hidden">
          <div className="size-24 shrink-0 animate-pulse rounded-md bg-muted sm:size-28" />
          <div className="size-24 shrink-0 animate-pulse rounded-md bg-muted sm:size-28" />
          <div className="size-24 shrink-0 animate-pulse rounded-md bg-muted sm:size-28" />
        </div>
      </div>
      <div className="grid gap-4">
        <div className="flex gap-2">
          <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-2">
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-11/12 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-md bg-muted" />
          <div className="h-28 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}

function FeedStatus({
  action,
  title,
  description,
}: {
  action?: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-10 text-center shadow-sm">
      <h3 className="text-lg font-semibold tracking-normal">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

function getSearchPattern(query: string) {
  return query
    .replace(/[\\%,().]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function EventsInfiniteList({
  categories,
}: {
  categories: EventFilterCategory[]
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const filters = useMemo(
    () =>
      getEventFilters({
        categories,
        categorySlug: searchParams.get("category"),
        countryCode: searchParams.get("country"),
        query: searchParams.get("q"),
      }),
    [categories, searchParams]
  )
  const activeFilters = hasEventFilters(filters)
  const filterLabel = getFilterLabel(filters)
  const queryKey = [
    "published-events",
    filters.query,
    filters.category?.id ?? "all-categories",
    filters.countryCode ?? "all-countries",
  ].join(":")

  const onlyPublishedEvents = useCallback<SupabaseQueryHandler>(
    (query) => {
      let nextQuery = query
        .eq("status", "published")
        .order("starts_at", { ascending: true })

      if (filters.category) {
        nextQuery = nextQuery.eq("category_id", filters.category.id)
      }

      if (filters.countryCode) {
        nextQuery = nextQuery.eq("country_code", filters.countryCode)
      }

      const searchPattern = getSearchPattern(filters.query)

      if (searchPattern) {
        const pattern = `%${searchPattern}%`
        nextQuery = nextQuery.or(
          [
            `title.ilike.${pattern}`,
            `description.ilike.${pattern}`,
            `city.ilike.${pattern}`,
            `location.ilike.${pattern}`,
          ].join(",")
        )
      }

      return nextQuery
    },
    [filters.category, filters.countryCode, filters.query]
  )

  const {
    count,
    data,
    error,
    fetchNextPage,
    hasMore,
    isFetching,
    isLoading,
    isSuccess,
  } = useInfiniteQuery<EventFeedItem>({
    tableName: "events",
    columns: PUBLIC_EVENT_COLUMNS,
    pageSize: PUBLIC_EVENTS_PAGE_SIZE,
    queryKey,
    trailingQuery: onlyPublishedEvents,
  })

  useEffect(() => {
    const sentinel = loadMoreRef.current

    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !isFetching) {
          fetchNextPage()
        }
      },
      {
        rootMargin: "320px 0px",
        threshold: 0.1,
      }
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [fetchNextPage, hasMore, isFetching])

  if (error) {
    return (
      <FeedStatus
        title="Events could not load"
        description="The public events feed is temporarily unavailable. Please refresh the page and try again."
      />
    )
  }

  return (
    <div className="grid gap-5">
      {isSuccess ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">
            {count} {count === 1 ? "event" : "events"}
            {activeFilters ? " found" : " published"}
          </p>
          <p className="max-w-xl text-sm text-muted-foreground">
            {filterLabel}
          </p>
        </div>
      ) : null}

      {isSuccess && data.length === 0 ? (
        <FeedStatus
          action={
            activeFilters ? (
              <Link
                href="/#events"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                Clear filters
              </Link>
            ) : null
          }
          title={
            activeFilters
              ? "No events match these filters"
              : "No published events yet"
          }
          description={
            activeFilters
              ? "Try a broader search, remove a filter, or check another country or category."
              : "Published events will appear here as soon as they are available."
          }
        />
      ) : null}

      {data.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      {isLoading || isFetching ? (
        <div className="grid gap-5" aria-label="Loading events">
          {Array.from({ length: isLoading ? 3 : 1 }).map((_, index) => (
            <EventSkeleton key={index} />
          ))}
        </div>
      ) : null}

      <div ref={loadMoreRef} className="h-px" aria-hidden="true" />

      {!hasMore && data.length > 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          You have reached the end.
        </p>
      ) : null}
    </div>
  )
}
