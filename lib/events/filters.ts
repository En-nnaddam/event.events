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

export type EventFilters = {
  category: EventFilterCategory | null
  countryCode: string | null
  query: string
}

export function normalizeFilterQuery(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 80)
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

export function getEventFilters({
  categories,
  categorySlug,
  countryCode,
  query,
}: {
  categories: EventFilterCategory[]
  categorySlug: string | null | undefined
  countryCode: string | null | undefined
  query: string | null | undefined
}): EventFilters {
  return {
    category: getFilterCategory(categories, categorySlug),
    countryCode: getFilterCountryCode(countryCode),
    query: normalizeFilterQuery(query),
  }
}

export function hasEventFilters(filters: EventFilters) {
  return Boolean(filters.category || filters.countryCode || filters.query)
}

export function getFilterLabel(filters: EventFilters) {
  const labels = [
    filters.query ? `"${filters.query}"` : null,
    filters.category?.name ?? null,
    getCountryOption(filters.countryCode)?.name ?? null,
  ].filter(Boolean)

  return labels.length > 0 ? labels.join(" / ") : "All events"
}
