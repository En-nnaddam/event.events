import type { EventCtaType } from "@/lib/admin/events"

export type EventFeedItem = {
  id: string
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
  categories: {
    name: string
  } | null
}
