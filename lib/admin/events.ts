export const EVENT_IMAGE_BUCKET = "event-images"
export const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024
export const PUBLIC_EVENTS_INITIAL_PAGE_SIZE = 3
export const PUBLIC_EVENTS_NEXT_PAGE_SIZE = 2
export const EVENT_STATUS_OPTIONS = ["published", "archived"] as const
export const EVENT_CTA_TYPES = [
  "external_link",
  "whatsapp",
  "phone",
  "none",
] as const
export const EVENT_PRICE_TYPES = ["free", "paid"] as const

export const CATEGORY_OPTION_COLUMNS = "id,name"
export const EVENT_FILTER_CATEGORY_COLUMNS = "id,name,slug"
export const ADMIN_EVENT_LIST_COLUMNS = `
  id,
  title,
  description,
  city,
  country_code,
  location,
  price_type,
  price_text,
  is_online,
  starts_at,
  cover_image_url,
  status,
  categories (
    name
  )
`
export const EVENT_FORM_COLUMNS = `
  id,
  category_id,
  title,
  description,
  city,
  country_code,
  location,
  price_type,
  price_text,
  is_online,
  starts_at,
  ends_at,
  cover_image_url,
  images,
  cta_type,
  cta_url,
  cta_phone
`
export const PUBLIC_EVENT_COLUMNS = `
  id,
  title,
  description,
  city,
  country_code,
  location,
  price_type,
  price_text,
  is_online,
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

export type EventStatus = "published" | "archived"
export type EventCtaType = "external_link" | "whatsapp" | "phone" | "none"
export type EventPriceType = "free" | "paid"

const eventCtaLabels: Record<EventCtaType, string> = {
  external_link: "Book now",
  none: "",
  phone: "Call now",
  whatsapp: "Message on WhatsApp",
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const eventCoverImageFilePattern = /^cover-\d+\.(?:jpg|webp)$/
const eventGalleryImageFilePattern = /^\d+-\d+-[a-z0-9-]+\.(?:jpg|webp)$/

export type CategoryOption = {
  id: string
  name: string
}

export type EventFormEvent = {
  id: string
  category_id: string
  title: string
  description: string | null
  city: string
  country_code: string | null
  location: string | null
  price_type: EventPriceType
  price_text: string | null
  is_online: boolean
  starts_at: string
  ends_at: string | null
  cover_image_url: string | null
  images: string[]
  cta_type: EventCtaType
  cta_url: string | null
  cta_phone: string | null
}

export type AdminEventListItem = {
  id: string
  title: string
  description: string | null
  city: string
  country_code: string | null
  location: string | null
  price_type: EventPriceType
  price_text: string | null
  is_online: boolean
  starts_at: string
  cover_image_url: string | null
  status: EventStatus
  categories: {
    name: string
  } | null
}

export type AdminRecentEvent = {
  id: string
  title: string
  status: EventStatus
  city: string
  starts_at: string
}

export function getStatus(value: string): EventStatus | null {
  return EVENT_STATUS_OPTIONS.includes(value as EventStatus)
    ? (value as EventStatus)
    : null
}

export function getCtaType(value: string): EventCtaType | null {
  return EVENT_CTA_TYPES.includes(value as EventCtaType)
    ? (value as EventCtaType)
    : null
}

export function getPriceType(value: string): EventPriceType | null {
  return EVENT_PRICE_TYPES.includes(value as EventPriceType)
    ? (value as EventPriceType)
    : null
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}

export function slugifyId(value: string) {
  const slug = slugify(value)

  if (!slug) {
    return ""
  }

  const randomBytes = new Uint8Array(6)
  globalThis.crypto.getRandomValues(randomBytes)
  const suffix = Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")

  return `${slug}-${suffix}`
}

export function isUuid(value: string) {
  return uuidPattern.test(value)
}

export function sanitizeStorageName(name: string) {
  const sanitized = name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return sanitized || "image"
}

export function buildEventCoverImagePath(
  eventId: string,
  extension: "jpg" | "webp",
  timestamp = Date.now()
) {
  if (!isUuid(eventId)) {
    throw new Error("invalid_event_id")
  }

  return `events/${eventId}/cover-${timestamp}.${extension}`
}

export function buildEventGalleryImagePath({
  eventId,
  extension,
  fileName,
  index,
  timestamp = Date.now(),
}: {
  eventId: string
  extension: "jpg" | "webp"
  fileName: string
  index: number
  timestamp?: number
}) {
  if (!isUuid(eventId)) {
    throw new Error("invalid_event_id")
  }

  return `events/${eventId}/gallery/${timestamp}-${index}-${sanitizeStorageName(fileName)}.${extension}`
}

function tryDecodeStoragePath(path: string) {
  try {
    return decodeURIComponent(path)
  } catch {
    return null
  }
}

export function isEventImageStoragePath(path: string) {
  const decodedPath = tryDecodeStoragePath(path)

  if (
    !decodedPath ||
    decodedPath !== path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("..")
  ) {
    return false
  }

  const segments = path.split("/")

  if (
    segments.some((segment) => segment.length === 0) ||
    segments[0] !== "events" ||
    !isUuid(segments[1] ?? "")
  ) {
    return false
  }

  if (segments.length === 3) {
    return eventCoverImageFilePattern.test(segments[2])
  }

  return (
    segments.length === 4 &&
    segments[2] === "gallery" &&
    eventGalleryImageFilePattern.test(segments[3])
  )
}

export function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  )
  return offsetDate.toISOString().slice(0, 16)
}

export function getEventCtaLabel(ctaType: EventCtaType) {
  return eventCtaLabels[ctaType]
}

export function getStoragePathFromPublicUrl(publicUrl: string) {
  const marker = `/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/`
  const [, path] = publicUrl.split(marker)

  if (!path) {
    return null
  }

  const decodedPath = tryDecodeStoragePath(path)

  return decodedPath && isEventImageStoragePath(decodedPath)
    ? decodedPath
    : null
}
