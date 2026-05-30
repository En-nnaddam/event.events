"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Cancel01Icon,
  FilterHorizontalIcon,
  FilterResetIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { DebouncedFilterInput } from "@/components/events/debounced-filter-input"
import { EventSearchInput } from "@/components/events/event-search-input"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { CountryFlag, getCountryOption } from "@/lib/countries"
import {
  getDateFilterLabel,
  getEventFilters,
  getFormatFilterLabel,
  getPriceFilterLabel,
  hasEventFilters,
  type EventDateFilter,
  type EventFilterCategory,
  type EventFormatFilter,
  type EventPriceFilter,
} from "@/lib/events/filters"
import { cn } from "@/lib/utils"

type EventsFilterBarProps = {
  categories: EventFilterCategory[]
}

type FilterUrlValues = {
  categorySlug: string
  city: string
  countryCode: string
  date: EventDateFilter | ""
  format: EventFormatFilter | ""
  fromDate: string
  price: EventPriceFilter | ""
  query: string
  toDate: string
}

const controlClassName =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"

function getActiveFilterCount({
  filters,
  activeCountry,
}: {
  filters: ReturnType<typeof getEventFilters>
  activeCountry: ReturnType<typeof getCountryOption>
}) {
  return [
    filters.query,
    filters.city,
    filters.category,
    activeCountry,
    filters.date,
    filters.price,
    filters.format,
  ].filter(Boolean).length
}

function buildSearchUrl({
  categorySlug,
  city,
  countryCode,
  date,
  format,
  fromDate,
  pathname,
  price,
  query,
  searchParams,
  toDate,
}: FilterUrlValues & {
  pathname: string
  searchParams: URLSearchParams
}) {
  const params = new URLSearchParams(searchParams)
  const cleanQuery = query.trim().replace(/\s+/g, " ")
  const cleanCity = city.trim().replace(/\s+/g, " ")

  params.delete("q")
  params.delete("category")
  params.delete("country")
  params.delete("city")
  params.delete("date")
  params.delete("from")
  params.delete("to")
  params.delete("price")
  params.delete("format")

  if (cleanQuery) {
    params.set("q", cleanQuery)
  }

  if (categorySlug) {
    params.set("category", categorySlug)
  }

  if (countryCode) {
    params.set("country", countryCode)
  }

  if (cleanCity) {
    params.set("city", cleanCity)
  }

  if (date) {
    params.set("date", date)
  }

  if (date === "custom") {
    if (fromDate) {
      params.set("from", fromDate)
    }

    if (toDate) {
      params.set("to", toDate)
    }
  }

  if (price) {
    params.set("price", price)
  }

  if (format) {
    params.set("format", format)
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

function FilterSection({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <div className="grid gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-sm font-semibold tracking-normal">{title}</h4>
      {children}
    </div>
  )
}

export function EventsFilterBar({ categories }: EventsFilterBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [, startTransition] = useTransition()
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
  const activeCountry = getCountryOption(filters.countryCode)
  const hasFilters = hasEventFilters(filters)
  const activeFilterCount = getActiveFilterCount({ filters, activeCountry })

  const categorySlug = filters.category?.slug ?? ""
  const city = filters.city
  const countryCode = filters.countryCode ?? ""
  const date = filters.date ?? ""
  const fromDate = filters.fromDate
  const price = filters.price ?? ""
  const format = filters.format ?? ""
  const toDate = filters.toDate
  const filterValuesRef = useRef<FilterUrlValues>({
    categorySlug,
    city,
    countryCode,
    date,
    format,
    fromDate,
    price,
    query: filters.query,
    toDate,
  })

  useEffect(() => {
    filterValuesRef.current = {
      categorySlug,
      city,
      countryCode,
      date,
      format,
      fromDate,
      price,
      query: filters.query,
      toDate,
    }
  }, [
    categorySlug,
    city,
    countryCode,
    date,
    filters.query,
    format,
    fromDate,
    price,
    toDate,
  ])

  function clearFilters() {
    filterValuesRef.current = {
      categorySlug: "",
      city: "",
      countryCode: "",
      date: "",
      format: "",
      fromDate: "",
      price: "",
      query: "",
      toDate: "",
    }
    startTransition(() =>
      router.replace(`${pathname}#events`, { scroll: false })
    )
  }

  function replaceFilters(
    nextFilters: Partial<Omit<FilterUrlValues, "countryCode">> & {
      countryCode?: string | null
    }
  ) {
    const currentFilters = filterValuesRef.current
    const isDateRangeUpdate =
      !("date" in nextFilters) &&
      ("fromDate" in nextFilters || "toDate" in nextFilters)
    const nextDate = isDateRangeUpdate
      ? "custom"
      : (nextFilters.date ?? currentFilters.date)
    const nextValues: FilterUrlValues = {
      categorySlug: nextFilters.categorySlug ?? currentFilters.categorySlug,
      city: nextFilters.city ?? currentFilters.city,
      countryCode:
        "countryCode" in nextFilters
          ? (nextFilters.countryCode ?? "")
          : currentFilters.countryCode,
      date: nextDate,
      format: nextFilters.format ?? currentFilters.format,
      fromDate:
        nextDate === "custom"
          ? (nextFilters.fromDate ?? currentFilters.fromDate)
          : "",
      price: nextFilters.price ?? currentFilters.price,
      query: nextFilters.query ?? currentFilters.query,
      toDate:
        nextDate === "custom"
          ? (nextFilters.toDate ?? currentFilters.toDate)
          : "",
    }

    filterValuesRef.current = nextValues

    const url = buildSearchUrl({
      ...nextValues,
      pathname,
      searchParams,
    })

    startTransition(() => router.replace(url, { scroll: false }))
  }

  function renderActiveFilters() {
    if (!hasFilters) {
      return null
    }

    return (
      <div className="flex flex-wrap gap-2">
        {filters.query ? (
          <FilterChip onRemove={() => replaceFilters({ query: "" })}>
            Search: {filters.query}
          </FilterChip>
        ) : null}

        {filters.city ? (
          <FilterChip onRemove={() => replaceFilters({ city: "" })}>
            City: {filters.city}
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

        {filters.date ? (
          <FilterChip
            onRemove={() =>
              replaceFilters({ date: "", fromDate: "", toDate: "" })
            }
          >
            Date: {getDateFilterLabel(filters)}
          </FilterChip>
        ) : null}

        {filters.price ? (
          <FilterChip onRemove={() => replaceFilters({ price: "" })}>
            Price: {getPriceFilterLabel(filters.price)}
          </FilterChip>
        ) : null}

        {filters.format ? (
          <FilterChip onRemove={() => replaceFilters({ format: "" })}>
            Format: {getFormatFilterLabel(filters.format)}
          </FilterChip>
        ) : null}
      </div>
    )
  }

  function renderFilterControls() {
    function updateFromDate(value: string) {
      replaceFilters({ fromDate: value })
    }

    function updateToDate(value: string) {
      replaceFilters({ toDate: value })
    }

    return (
      <div className="grid gap-5">
        <FilterSection title="Find">
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
            <span>City</span>
            <DebouncedFilterInput
              className={controlClassName}
              key={`city-filter-${city}`}
              onValueChange={(nextCity) => replaceFilters({ city: nextCity })}
              placeholder="All cities"
              value={city}
            />
          </label>
        </FilterSection>

        <FilterSection title="Place">
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
        </FilterSection>

        <FilterSection title="Date">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>Quick date</span>
            <select
              className={controlClassName}
              onChange={(event) =>
                replaceFilters({
                  date: event.target.value as EventDateFilter | "",
                })
              }
              value={date}
            >
              <option value="">All dates</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="upcoming">Upcoming</option>
              <option value="custom">Custom range</option>
            </select>
          </label>

          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>From</span>
              <input
                className={`${controlClassName} min-w-0`}
                onInput={(event) => updateFromDate(event.currentTarget.value)}
                type="date"
                value={fromDate}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>To</span>
              <input
                className={`${controlClassName} min-w-0`}
                onInput={(event) => updateToDate(event.currentTarget.value)}
                type="date"
                value={toDate}
              />
            </label>
          </div>
        </FilterSection>

        <FilterSection title="Access">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>Price</span>
            <select
              className={controlClassName}
              onChange={(event) =>
                replaceFilters({
                  price: event.target.value as EventPriceFilter | "",
                })
              }
              value={price}
            >
              <option value="">All prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>Format</span>
            <select
              className={controlClassName}
              onChange={(event) =>
                replaceFilters({
                  format: event.target.value as EventFormatFilter | "",
                })
              }
              value={format}
            >
              <option value="">All formats</option>
              <option value="online">Online</option>
              <option value="in_place">In place</option>
            </select>
          </label>
        </FilterSection>
      </div>
    )
  }

  function renderPanel({
    className,
    showHeader = true,
  }: {
    className?: string
    showHeader?: boolean
  } = {}) {
    return (
      <div
        className={cn(
          "grid gap-5 rounded-lg border border-border bg-card p-4 shadow-sm",
          className
        )}
      >
        {showHeader ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Filter events
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-normal">
                Narrow the feed
              </h3>
            </div>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                aria-label="Clear filters"
                title="Clear filters"
              >
                <HugeiconsIcon
                  icon={FilterResetIcon}
                  strokeWidth={2}
                  className="size-4"
                />
              </button>
            ) : null}
          </div>
        ) : null}

        {renderFilterControls()}
        {renderActiveFilters()}
      </div>
    )
  }

  return (
    <>
      <div className="mb-5 grid gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
        >
          <HugeiconsIcon
            icon={FilterHorizontalIcon}
            strokeWidth={2}
            className="size-4"
          />
          Filters
          {activeFilterCount ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        {renderActiveFilters()}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-foreground/35"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-lg border border-border bg-background p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Filter events
                </p>
                <h3 className="text-xl font-semibold tracking-normal">
                  Narrow the feed
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-border transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                    aria-label="Clear filters"
                  >
                    <HugeiconsIcon
                      icon={FilterResetIcon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                  aria-label="Close filters"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </button>
              </div>
            </div>
            {renderPanel({
              className: "border-0 p-0 shadow-none",
              showHeader: false,
            })}
          </div>
        </div>
      ) : null}

      <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
        {renderPanel()}
      </aside>
    </>
  )
}
