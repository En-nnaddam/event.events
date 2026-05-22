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

export type CategoryOption = {
  id: string
  name: string
  slug: string
}

export type AdminEventRow = {
  id: string
  category_id: string
  title: string
  slug: string
  description: string | null
  city: string
  location: string | null
  starts_at: string
  ends_at: string | null
  cover_image_url: string | null
  images: string[]
  cta_type: EventCtaType
  cta_label: string | null
  cta_url: string | null
  cta_phone: string | null
  status: EventStatus
  created_at: string
  updated_at: string
  categories: {
    name: string
    slug: string
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

export function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

export function getEventCtaLabel(ctaType: EventCtaType) {
  return eventCtaLabels[ctaType]
}

export function getStoragePathFromPublicUrl(publicUrl: string) {
  const marker = `/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/`
  const [, path] = publicUrl.split(marker)

  return path ? decodeURIComponent(path) : null
}
