import { getEventCtaLabel } from "@/lib/admin/events"
import type { EventFeedItem } from "@/lib/events/types"

export type EventDateStatus = "ended" | "today" | "upcoming"

const detailDateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})

const detailTimeFormatter = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const rtlTextPattern = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

export function hasRtlText(value: string | null | undefined) {
  return Boolean(value && rtlTextPattern.test(value))
}

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameLocalDay(firstDate: Date, secondDate: Date) {
  return (
    getLocalDayStart(firstDate).getTime() ===
    getLocalDayStart(secondDate).getTime()
  )
}

function isLocalDayBetween(date: Date, startsAt: Date, endsAt: Date) {
  const dayStart = getLocalDayStart(date).getTime()

  return (
    dayStart >= getLocalDayStart(startsAt).getTime() &&
    dayStart <= getLocalDayStart(endsAt).getTime()
  )
}

export function getEventDateStatus(
  event: EventFeedItem,
  now = new Date()
): EventDateStatus {
  const startsAt = new Date(event.starts_at)
  const endsAt = event.ends_at ? new Date(event.ends_at) : null
  const eventEnd = endsAt ?? startsAt

  if (now > eventEnd) {
    return "ended"
  }

  if (
    endsAt
      ? isLocalDayBetween(now, startsAt, endsAt)
      : isSameLocalDay(now, startsAt)
  ) {
    return "today"
  }

  return "upcoming"
}

export function formatEventDateTime(value: string) {
  const date = new Date(value)

  return {
    date: detailDateFormatter.format(date),
    time: detailTimeFormatter.format(date),
  }
}

export function getEventCta(event: EventFeedItem) {
  if (event.cta_type === "external_link" && event.cta_url) {
    return {
      href: event.cta_url,
      label: getEventCtaLabel(event.cta_type),
    }
  }

  if (event.cta_type === "whatsapp" && event.cta_phone) {
    const phone = event.cta_phone.replace(/[^\d]/g, "")

    return {
      href: `https://wa.me/${phone}`,
      label: getEventCtaLabel(event.cta_type),
    }
  }

  if (event.cta_type === "phone" && event.cta_phone) {
    return {
      href: `tel:${event.cta_phone}`,
      label: getEventCtaLabel(event.cta_type),
    }
  }

  return null
}
