"use client"

import { useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Cancel01Icon, FilterResetIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { EventSearchInput } from "@/components/events/event-search-input"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { CountryFlag, getCountryOption } from "@/lib/countries"
import {
  getEventFilters,
  hasEventFilters,
  type EventFilterCategory,
} from "@/lib/events/filters"

type EventsFilterBarProps = {
  categories: EventFilterCategory[]
}

const controlClassName =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"

function buildSearchUrl({
  categorySlug,
  countryCode,
  pathname,
  query,
  searchParams,
}: {
  categorySlug: string
  countryCode: string | null
  pathname: string
  query: string
  searchParams: URLSearchParams
}) {
  const params = new URLSearchParams(searchParams)
  const cleanQuery = query.trim().replace(/\s+/g, " ")

  params.delete("q")
  params.delete("category")
  params.delete("country")

  if (cleanQuery) {
    params.set("q", cleanQuery)
  }

  if (categorySlug) {
    params.set("category", categorySlug)
  }

  if (countryCode) {
    params.set("country", countryCode)
  }

  const queryString = params.toString()

  return `${pathname}${queryString ? `?${queryString}` : ""}#events`
}

function FilterChip({
  children,
  onRemove,
}: {
  children: React.ReactNode
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
    >
      <span className="min-w-0 truncate">{children}</span>
      <HugeiconsIcon
        icon={Cancel01Icon}
        strokeWidth={2}
        className="size-3.5 shrink-0 text-muted-foreground"
      />
    </button>
  )
}

export function EventsFilterBar({ categories }: EventsFilterBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
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
  const activeCountry = getCountryOption(filters.countryCode)
  const hasFilters = hasEventFilters(filters)

  const categorySlug = filters.category?.slug ?? ""
  const countryCode = filters.countryCode ?? ""

  function replaceFilters(nextFilters: {
    categorySlug?: string
    countryCode?: string | null
    query?: string
  }) {
    const url = buildSearchUrl({
      categorySlug: nextFilters.categorySlug ?? categorySlug,
      countryCode: nextFilters.countryCode ?? countryCode,
      pathname,
      query: nextFilters.query ?? filters.query,
      searchParams,
    })

    startTransition(() => router.replace(url, { scroll: false }))
  }

  return (
    <div className="mb-6 grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Filter events
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-normal">
            Find the right event faster
          </h3>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={() =>
              router.replace(`${pathname}#events`, { scroll: false })
            }
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            <HugeiconsIcon
              icon={FilterResetIcon}
              strokeWidth={2}
              className="size-4"
            />
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.8fr)_minmax(12rem,0.8fr)]">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>Search</span>
          <EventSearchInput
            key={`event-search-${filters.query}`}
            className={`${controlClassName} pl-10`}
            onQueryChange={(query) => replaceFilters({ query })}
            value={filters.query}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>Category</span>
          <select
            className={controlClassName}
            onChange={(event) =>
              replaceFilters({ categorySlug: event.target.value })
            }
            value={categorySlug}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 text-sm font-medium text-foreground">
          <span>Country</span>
          <CountryCombobox
            ariaLabel="Country filter"
            key={`country-filter-${countryCode || "all"}`}
            onValueChange={(nextCountryCode) =>
              replaceFilters({ countryCode: nextCountryCode })
            }
            placeholder="All countries"
            value={countryCode}
          />
        </div>
      </div>

      {hasFilters ? (
        <div className="flex flex-wrap gap-2">
          {filters.query ? (
            <FilterChip onRemove={() => replaceFilters({ query: "" })}>
              Search: {filters.query}
            </FilterChip>
          ) : null}

          {filters.category ? (
            <FilterChip onRemove={() => replaceFilters({ categorySlug: "" })}>
              Category: {filters.category.name}
            </FilterChip>
          ) : null}

          {activeCountry ? (
            <FilterChip onRemove={() => replaceFilters({ countryCode: "" })}>
              <span className="inline-flex items-center gap-1.5">
                <CountryFlag
                  code={activeCountry.code}
                  className="h-3.5 w-5 rounded-[2px] shadow-sm ring-1 ring-border/70"
                />
                {activeCountry.name}
              </span>
            </FilterChip>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
