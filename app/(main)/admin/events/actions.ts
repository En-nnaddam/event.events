"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import {
  EVENT_IMAGE_BUCKET,
  getEventCtaLabel,
  getStoragePathFromPublicUrl,
  isEventImageStoragePath,
  isUuid,
  slugify,
  type EventCtaType,
  type EventStatus,
} from "@/lib/admin/events"

type EventPayload = {
  category_id: string
  title: string
  slug: string
  description: string | null
  city: string
  location: string | null
  starts_at: string
  ends_at: string | null
  cta_type: EventCtaType
  cta_label: string | null
  cta_url: string | null
  cta_phone: string | null
}

type EventActionResult = {
  eventId?: string
  error?: string
  ok: boolean
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function getNullableText(formData: FormData, key: string) {
  const value = getText(formData, key)
  return value.length > 0 ? value : null
}

function getStatus(value: string): EventStatus | null {
  return value === "published" || value === "archived" ? value : null
}

function getCtaType(value: string): EventCtaType | null {
  return value === "external_link" ||
    value === "whatsapp" ||
    value === "phone" ||
    value === "none"
    ? value
    : null
}

function fail(error: string): EventActionResult {
  return { ok: false, error }
}

function isDigitsOnly(value: string) {
  return /^\d+$/.test(value)
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function parseEventPayload(
  formData: FormData
): EventPayload | { error: string } {
  const title = getText(formData, "title")
  const slug = slugify(title)
  const categoryId = getText(formData, "category_id")
  const city = getText(formData, "city")
  const startsAtValue = getText(formData, "starts_at")
  const endsAtValue = getText(formData, "ends_at")
  const ctaType = getCtaType(getText(formData, "cta_type"))

  if (!title || !slug || !categoryId || !city || !startsAtValue || !ctaType) {
    return { error: "missing_fields" }
  }

  if (!isUuid(categoryId)) {
    return { error: "missing_fields" }
  }

  const startsAt = new Date(startsAtValue)
  const endsAt = endsAtValue ? new Date(endsAtValue) : null

  if (
    Number.isNaN(startsAt.getTime()) ||
    (endsAt && Number.isNaN(endsAt.getTime()))
  ) {
    return { error: "invalid_date" }
  }

  if (endsAt && endsAt <= startsAt) {
    return { error: "invalid_date_range" }
  }

  const ctaUrl = getNullableText(formData, "cta_url")
  const ctaPhone = getNullableText(formData, "cta_phone")

  if (ctaType === "external_link" && !ctaUrl) {
    return { error: "missing_cta_url" }
  }

  if (ctaType === "external_link" && ctaUrl && !isHttpUrl(ctaUrl)) {
    return { error: "invalid_cta_url" }
  }

  if ((ctaType === "whatsapp" || ctaType === "phone") && !ctaPhone) {
    return { error: "missing_cta_phone" }
  }

  if (
    (ctaType === "whatsapp" || ctaType === "phone") &&
    ctaPhone &&
    !isDigitsOnly(ctaPhone)
  ) {
    return { error: "invalid_cta_phone" }
  }

  return {
    category_id: categoryId,
    title,
    slug,
    description: getNullableText(formData, "description"),
    city,
    location: getNullableText(formData, "location"),
    starts_at: startsAt.toISOString(),
    ends_at: endsAt ? endsAt.toISOString() : null,
    cta_type: ctaType,
    cta_label: getEventCtaLabel(ctaType) || null,
    cta_url: ctaType === "external_link" ? ctaUrl : null,
    cta_phone: ctaType === "whatsapp" || ctaType === "phone" ? ctaPhone : null,
  }
}

async function removeImageUrls(urls: Array<string | null | undefined>) {
  const paths = urls
    .filter((url): url is string => Boolean(url))
    .map(getStoragePathFromPublicUrl)
    .filter((path): path is string => Boolean(path))

  if (paths.length === 0) {
    return
  }

  const { supabase } = await requireAdmin()
  await supabase.storage.from(EVENT_IMAGE_BUCKET).remove(paths)
}

function getRepeatedText(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0
    )
}

export async function createEvent(
  formData: FormData
): Promise<EventActionResult> {
  const { supabase, user } = await requireAdmin()
  const payload = parseEventPayload(formData)

  if ("error" in payload) {
    return fail(payload.error)
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...payload,
      created_by: user.id,
      cover_image_url: null,
      images: [],
    })
    .select("id")
    .single<{ id: string }>()

  if (error || !data?.id) {
    return fail("save_failed")
  }

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/events")
  return { ok: true, eventId: data.id }
}

export async function updateEvent(
  eventId: string,
  formData: FormData
): Promise<EventActionResult> {
  if (!isUuid(eventId)) {
    return fail("missing_event")
  }

  const { supabase } = await requireAdmin()
  const payload = parseEventPayload(formData)
  const coverImageUrl = getNullableText(formData, "cover_image_url")
  const galleryUrls = getRepeatedText(formData, "images")
  const removedImageUrls = getRepeatedText(formData, "removed_image_urls")

  if ("error" in payload) {
    return fail(payload.error)
  }

  const { data: currentEvent } = await supabase
    .from("events")
    .select("cover_image_url,images")
    .eq("id", eventId)
    .maybeSingle<{ cover_image_url: string | null; images: string[] }>()

  if (!currentEvent) {
    return fail("missing_event")
  }

  const { error } = await supabase
    .from("events")
    .update({ ...payload, cover_image_url: coverImageUrl, images: galleryUrls })
    .eq("id", eventId)

  if (error) {
    return fail("save_failed")
  }

  const removedUrls = removedImageUrls.length
    ? removedImageUrls
    : [
        currentEvent.cover_image_url !== coverImageUrl
          ? currentEvent.cover_image_url
          : null,
        ...currentEvent.images.filter((image) => !galleryUrls.includes(image)),
      ]
  await removeImageUrls(removedUrls)

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/events")
  revalidatePath(`/admin/events/${eventId}/edit`)
  return { ok: true }
}

export async function updateEventImages(
  eventId: string,
  formData: FormData
): Promise<EventActionResult> {
  if (!isUuid(eventId)) {
    return fail("missing_event")
  }

  const { supabase } = await requireAdmin()
  const coverImageUrl = getNullableText(formData, "cover_image_url")
  const galleryUrls = getRepeatedText(formData, "images")

  const { data: currentEvent } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle<{ id: string }>()

  if (!currentEvent) {
    return fail("missing_event")
  }

  const { error } = await supabase
    .from("events")
    .update({ cover_image_url: coverImageUrl, images: galleryUrls })
    .eq("id", eventId)

  if (error) {
    return fail("save_failed")
  }

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/events")
  revalidatePath(`/admin/events/${eventId}/edit`)
  return { ok: true, eventId }
}

export async function updateEventStatus(formData: FormData) {
  const eventId = getText(formData, "event_id")
  const status = getStatus(getText(formData, "status"))

  if (!eventId || !status) {
    redirect("/admin/events?error=invalid_status")
  }

  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)

  if (error) {
    redirect("/admin/events?error=status_failed")
  }

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/events")
  redirect("/admin/events")
}

export async function deleteEvent(formData: FormData) {
  const eventId = getText(formData, "event_id")

  if (!eventId) {
    redirect("/admin/events?error=missing_event")
  }

  const { supabase } = await requireAdmin()
  const { data: event } = await supabase
    .from("events")
    .select("cover_image_url,images")
    .eq("id", eventId)
    .maybeSingle<{ cover_image_url: string | null; images: string[] }>()

  const { error } = await supabase.from("events").delete().eq("id", eventId)

  if (error) {
    redirect("/admin/events?error=delete_failed")
  }

  if (event) {
    await removeImageUrls([event.cover_image_url, ...event.images])
  }

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/events")
  redirect("/admin/events")
}

export async function cleanupEventImages(
  paths: string[]
): Promise<EventActionResult> {
  const { supabase } = await requireAdmin()
  const safePaths = paths.filter(isEventImageStoragePath)

  if (safePaths.length === 0) {
    return { ok: true }
  }

  const { error } = await supabase.storage
    .from(EVENT_IMAGE_BUCKET)
    .remove(safePaths)

  if (error) {
    return fail("cleanup_failed")
  }

  return { ok: true }
}
