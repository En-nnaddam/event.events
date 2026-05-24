export const EVENT_IMAGE_BUCKET = "event-images"
export const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024

export type EventStatus = "published" | "archived"
export type EventCtaType = "external_link" | "whatsapp" | "phone" | "none"

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
  starts_at: string
  cover_image_url: string | null
  status: EventStatus
  categories: {
    name: string
  } | null
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
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
