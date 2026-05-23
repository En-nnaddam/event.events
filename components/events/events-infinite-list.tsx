"use client"

import { useCallback, useEffect, useRef } from "react"

import { EventCard, type EventFeedItem } from "@/components/events/event-card"
import {
  useInfiniteQuery,
  type SupabaseQueryHandler,
} from "@/hooks/use-infinite-query"

const PAGE_SIZE = 6
const EVENT_COLUMNS = `
  id,
  title,
  description,
  city,
  location,
  starts_at,
  ends_at,
  cover_image_url,
  images,
  cta_type,
  cta_url,
  cta_phone,
  categories (
    name
  )
`

function EventSkeleton() {
  return (
    <div className="grid gap-5 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(220px,0.42fr)_1fr] md:p-5">
      <div className="min-h-56 animate-pulse rounded-lg bg-muted" />
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
          <div className="h-20 animate-pulse rounded-md bg-muted" />
          <div className="h-20 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}

function FeedStatus({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-10 text-center shadow-sm">
      <h3 className="text-lg font-semibold tracking-normal">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function EventsInfiniteList() {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const onlyPublishedEvents = useCallback<SupabaseQueryHandler>((query) => {
    return query
      .eq("status", "published")
      .order("starts_at", { ascending: true })
  }, [])

  const {
    data,
    error,
    fetchNextPage,
    hasMore,
    isFetching,
    isLoading,
    isSuccess,
  } = useInfiniteQuery<EventFeedItem>({
    tableName: "events",
    columns: EVENT_COLUMNS,
    pageSize: PAGE_SIZE,
    queryKey: "published-events-by-start-date",
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
      {isSuccess && data.length === 0 ? (
        <FeedStatus
          title="No published events yet"
          description="Published events will appear here as soon as they are available."
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
