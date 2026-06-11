import type { EventCtaType, EventPriceType } from "@/lib/admin/events"

export type EventFeedItem = {
  id: string
  slug: string
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
  categories: {
    name: string
  } | null
}
