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
  PUBLIC_EVENTS_INITIAL_PAGE_SIZE,
  PUBLIC_EVENTS_NEXT_PAGE_SIZE,
} from "@/lib/admin/events"
import {
  getEventFilters,
  getFilterLabel,
  hasEventFilters,
  type EventFilterCategory,
  type EventFilters,
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

function getEndOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  )
}

function getStartOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getEventDateRange(filters: EventFilters, now = new Date()) {
  if (!filters.date) {
    return null
  }

  const todayStart = getStartOfLocalDay(now)

  if (filters.date === "today") {
    return {
      from: todayStart,
      to: getEndOfLocalDay(todayStart),
    }
  }

  if (filters.date === "week") {
    const weekEnd = getEndOfLocalDay(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    return {
      from: todayStart,
      to: weekEnd,
    }
  }

  if (filters.date === "month") {
    return {
      from: todayStart,
      to: getEndOfLocalDay(
        new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0)
      ),
    }
  }

  if (filters.date === "upcoming") {
    return {
      from: todayStart,
      to: null,
    }
  }

  const from = filters.fromDate
    ? getStartOfLocalDay(new Date(`${filters.fromDate}T00:00:00`))
    : null
  const to = filters.toDate
    ? getEndOfLocalDay(new Date(`${filters.toDate}T00:00:00`))
    : null

  if (from && to && from > to) {
    return {
      from: getStartOfLocalDay(to),
      to: getEndOfLocalDay(from),
    }
  }

  return from || to ? { from, to } : null
}

function getIsoDateValue(date: Date) {
  return date.toISOString()
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
        city: searchParams.get("city"),
        countryCode: searchParams.get("country"),
        date: searchParams.get("date"),
        format: searchParams.get("format"),
        fromDate: searchParams.get("from"),
        price: searchParams.get("price"),
        query: searchParams.get("q"),
        toDate: searchParams.get("to"),
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
    filters.city || "all-cities",
    filters.date ?? "all-dates",
    filters.fromDate || "no-from",
    filters.toDate || "no-to",
    filters.price ?? "all-prices",
    filters.format ?? "all-formats",
  ].join(":")

  const onlyPublishedEvents = useCallback<SupabaseQueryHandler>(
    (query) => {
      let nextQuery = query
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (filters.category) {
        nextQuery = nextQuery.eq("category_id", filters.category.id)
      }

      if (filters.countryCode) {
        nextQuery = nextQuery.eq("country_code", filters.countryCode)
      }

      if (filters.city) {
        nextQuery = nextQuery.ilike(
          "city",
          `%${getSearchPattern(filters.city)}%`
        )
      }

      if (filters.price) {
        nextQuery = nextQuery.eq("price_type", filters.price)
      }

      if (filters.format === "online") {
        nextQuery = nextQuery.eq("is_online", true)
      }

      if (filters.format === "in_place") {
        nextQuery = nextQuery.eq("is_online", false)
      }

      const dateRange = getEventDateRange(filters)

      if (dateRange?.to) {
        nextQuery = nextQuery.lte("starts_at", getIsoDateValue(dateRange.to))
      }

      if (dateRange?.from) {
        const fromDate = getIsoDateValue(dateRange.from)
        nextQuery = nextQuery.or(
          `ends_at.gte.${fromDate},and(ends_at.is.null,starts_at.gte.${fromDate})`
        )
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
    [filters]
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
    initialPageSize: PUBLIC_EVENTS_INITIAL_PAGE_SIZE,
    nextPageSize: PUBLIC_EVENTS_NEXT_PAGE_SIZE,
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
