import {
  getCountryOption,
  isCountryCode,
  normalizeCountryCode,
} from "@/lib/country-data"

export type EventFilterCategory = {
  id: string
  name: string
  slug: string
}

export const EVENT_DATE_FILTERS = [
  "today",
  "week",
  "month",
  "upcoming",
  "custom",
] as const
export const EVENT_PRICE_FILTERS = ["free", "paid"] as const
export const EVENT_FORMAT_FILTERS = ["online", "in_place"] as const

export type EventDateFilter = (typeof EVENT_DATE_FILTERS)[number]
export type EventPriceFilter = (typeof EVENT_PRICE_FILTERS)[number]
export type EventFormatFilter = (typeof EVENT_FORMAT_FILTERS)[number]

export type EventFilters = {
  category: EventFilterCategory | null
  countryCode: string | null
  city: string
  date: EventDateFilter | null
  fromDate: string
  format: EventFormatFilter | null
  price: EventPriceFilter | null
  query: string
  toDate: string
}

export function normalizeFilterQuery(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 80)
}

export function normalizeCityFilter(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 60)
}

export function getFilterCategory(
  categories: EventFilterCategory[],
  slug: string | null | undefined
) {
  if (!slug) {
    return null
  }

  return categories.find((category) => category.slug === slug) ?? null
}

export function getFilterCountryCode(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const countryCode = normalizeCountryCode(value)

  return isCountryCode(countryCode) ? countryCode : null
}

export function getFilterDate(value: string | null | undefined) {
  return EVENT_DATE_FILTERS.includes(value as EventDateFilter)
    ? (value as EventDateFilter)
    : null
}

export function getFilterPrice(value: string | null | undefined) {
  return EVENT_PRICE_FILTERS.includes(value as EventPriceFilter)
    ? (value as EventPriceFilter)
    : null
}

export function getFilterFormat(value: string | null | undefined) {
  return EVENT_FORMAT_FILTERS.includes(value as EventFormatFilter)
    ? (value as EventFormatFilter)
    : null
}

export function normalizeDateValue(value: string | null | undefined) {
  const dateValue = (value ?? "").trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return ""
  }

  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}` === dateValue ? dateValue : ""
}

export function getEventFilters({
  categories,
  categorySlug,
  city,
  countryCode,
  date,
  format,
  fromDate,
  price,
  query,
  toDate,
}: {
  categories: EventFilterCategory[]
  categorySlug: string | null | undefined
  city: string | null | undefined
  countryCode: string | null | undefined
  date: string | null | undefined
  format: string | null | undefined
  fromDate: string | null | undefined
  price: string | null | undefined
  query: string | null | undefined
  toDate: string | null | undefined
}): EventFilters {
  const filterDate = getFilterDate(date)

  return {
    category: getFilterCategory(categories, categorySlug),
    city: normalizeCityFilter(city),
    countryCode: getFilterCountryCode(countryCode),
    date: filterDate,
    format: getFilterFormat(format),
    fromDate: filterDate === "custom" ? normalizeDateValue(fromDate) : "",
    price: getFilterPrice(price),
    query: normalizeFilterQuery(query),
    toDate: filterDate === "custom" ? normalizeDateValue(toDate) : "",
  }
}

export function hasEventFilters(filters: EventFilters) {
  return Boolean(
    filters.category ||
    filters.city ||
    filters.countryCode ||
    filters.date ||
    filters.format ||
    filters.price ||
    filters.query
  )
}

export function getFilterLabel(filters: EventFilters) {
  const labels = [
    filters.query ? `"${filters.query}"` : null,
    filters.category?.name ?? null,
    getCountryOption(filters.countryCode)?.name ?? null,
    filters.city ? `City: ${filters.city}` : null,
    filters.date ? getDateFilterLabel(filters) : null,
    filters.price ? getPriceFilterLabel(filters.price) : null,
    filters.format ? getFormatFilterLabel(filters.format) : null,
  ].filter(Boolean)

  return labels.length > 0 ? labels.join(" / ") : "All events"
}

export function getDateFilterLabel(
  filters: Pick<EventFilters, "date" | "fromDate" | "toDate">
) {
  if (filters.date === "today") {
    return "Today"
  }

  if (filters.date === "week") {
    return "This week"
  }

  if (filters.date === "month") {
    return "This month"
  }

  if (filters.date === "upcoming") {
    return "Upcoming"
  }

  if (filters.date === "custom") {
    if (filters.fromDate && filters.toDate) {
      return `${filters.fromDate} to ${filters.toDate}`
    }

    if (filters.fromDate) {
      return `From ${filters.fromDate}`
    }

    if (filters.toDate) {
      return `Until ${filters.toDate}`
    }

    return "Custom dates"
  }

  return "All dates"
}

export function getPriceFilterLabel(price: EventPriceFilter) {
  return price === "free" ? "Free" : "Paid"
}

export function getFormatFilterLabel(format: EventFormatFilter) {
  return format === "online" ? "Online" : "In place"
}
