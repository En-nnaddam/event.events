"use client"

import { useId, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight01Icon,
  Calendar01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { getTodayDateValue, normalizeDateValue } from "@/lib/events/filters"

function normalizeHeroQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80)
}

function getDiscoverUrl({ date, query }: { date: string; query: string }) {
  const params = new URLSearchParams()
  const cleanQuery = normalizeHeroQuery(query)
  const dateValue = normalizeDateValue(date)

  if (cleanQuery) {
    params.set("q", cleanQuery)
  }

  if (dateValue) {
    params.set("date", "custom")
    params.set("from", dateValue)
    params.set("to", dateValue)
  }

  const queryString = params.toString()

  return `/discover${queryString ? `?${queryString}` : ""}#events`
}

export function HomeDiscoveryForm() {
  const router = useRouter()
  const searchId = useId()
  const dateId = useId()
  const [query, setQuery] = useState("")
  const [date, setDate] = useState("")
  const todayValue = useMemo(() => getTodayDateValue(), [])

  return (
    <form
      className="mt-8 grid w-full max-w-5xl gap-3 rounded-lg border border-white/16 bg-background/88 p-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_13rem_12rem] dark:bg-background/82"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const formQuery = String(formData.get("q") ?? query)
        const formDate = String(formData.get("date") ?? date)

        router.push(getDiscoverUrl({ date: formDate, query: formQuery }))
      }}
    >
      <label
        htmlFor={searchId}
        className="grid min-w-0 gap-2 text-sm font-medium text-foreground"
      >
        <span className="sr-only">Search events</span>
        <span className="relative block min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={searchId}
            className="h-12 w-full min-w-0 rounded-md border border-border bg-background px-10 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
            name="q"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search chess, Rabat, Morocco..."
            value={query}
          />
        </span>
      </label>

      <label
        htmlFor={dateId}
        className="grid min-w-0 gap-2 text-sm font-medium text-foreground"
      >
        <span className="sr-only">Event date</span>
        <span className="relative block min-w-0">
          <HugeiconsIcon
            icon={Calendar01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={dateId}
            className="h-12 w-full min-w-0 rounded-md border border-border bg-background px-10 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
            min={todayValue}
            name="date"
            onChange={(event) => setDate(event.currentTarget.value)}
            type="date"
            value={date}
          />
        </span>
      </label>

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        Discover events
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="size-4"
        />
      </button>
    </form>
  )
}
