"use server"

import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import {
  EVENT_IMAGE_BUCKET,
  formatDateTimeLocal,
  getCtaType,
  getEventCtaLabel,
  getStatus,
  getStoragePathFromPublicUrl,
  isEventImageStoragePath,
  isUuid,
  slugify,
  slugifyId,
  type EventCtaType,
} from "@/lib/admin/events"
import { revalidateEventConsumers } from "@/lib/admin/revalidation"
import { isCountryCode, normalizeCountryCode } from "@/lib/country-data"
import {
  getNullableText,
  getRepeatedText,
  getText,
} from "@/lib/forms/form-data"
type EventPayload = EventPayloadDetails & {
  slug: string
}

type EventPayloadDetails = {
  category_id: string
  title: string
  description: string | null
  city: string
  country_code: string | null
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

function getDateDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getTodayStart() {
  return getDateDayStart(new Date())
}

function isBeforeToday(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return getDateDayStart(date) < getTodayStart()
}

function isUnchangedDateTime(
  nextValue: string | null,
  currentValue: string | null
) {
  return formatDateTimeLocal(nextValue) === formatDateTimeLocal(currentValue)
}

function isNewPastDate(nextValue: string | null, currentValue: string | null) {
  if (!nextValue) {
    return false
  }

  return (
    !isUnchangedDateTime(nextValue, currentValue) && isBeforeToday(nextValue)
  )
}

function parseEventPayloadDetails(
  formData: FormData
): EventPayloadDetails | { error: string } {
  const title = getText(formData, "title")
  const categoryId = getText(formData, "category_id")
  const city = getText(formData, "city")
  const countryCodeValue = getText(formData, "country_code")
  const startsAtValue = getText(formData, "starts_at")
  const endsAtValue = getText(formData, "ends_at")
  const ctaType = getCtaType(getText(formData, "cta_type"))

  if (!title || !categoryId || !city || !startsAtValue || !ctaType) {
    return { error: "missing_fields" }
  }

  if (!slugify(title)) {
    return { error: "generating_slug_failed" }
  }

  if (!isUuid(categoryId)) {
    return { error: "missing_fields" }
  }

  const countryCode = countryCodeValue
    ? normalizeCountryCode(countryCodeValue)
    : null

  if (countryCode && !isCountryCode(countryCode)) {
    return { error: "invalid_country" }
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
    description: getNullableText(formData, "description"),
    city,
    country_code: countryCode,
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

export async function createEvent(
  formData: FormData
): Promise<EventActionResult> {
  const { supabase, user } = await requireAdmin()
  const payloadDetails = parseEventPayloadDetails(formData)

  if ("error" in payloadDetails) {
    return fail(payloadDetails.error)
  }

  if (isBeforeToday(payloadDetails.starts_at)) {
    return fail("past_date")
  }

  const slug = slugifyId(payloadDetails.title)

  if (!slug) {
    return fail("generating_slug_failed")
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...payloadDetails,
      slug,
      created_by: user.id,
      cover_image_url: null,
      images: [],
    })
    .select("id")
    .single<{ id: string }>()

  if (error || !data?.id) {
    return fail("save_failed")
  }

  revalidateEventConsumers()
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
  const payloadDetails = parseEventPayloadDetails(formData)
  const coverImageUrl = getNullableText(formData, "cover_image_url")
  const galleryUrls = getRepeatedText(formData, "images")
  const removedImageUrls = getRepeatedText(formData, "removed_image_urls")

  if ("error" in payloadDetails) {
    return fail(payloadDetails.error)
  }

  const { data: currentEvent } = await supabase
    .from("events")
    .select("title,slug,starts_at,ends_at,cover_image_url,images")
    .eq("id", eventId)
    .maybeSingle<{
      title: string
      slug: string
      starts_at: string
      ends_at: string | null
      cover_image_url: string | null
      images: string[]
    }>()

  if (!currentEvent) {
    return fail("missing_event")
  }

  if (
    isNewPastDate(payloadDetails.starts_at, currentEvent.starts_at) ||
    isNewPastDate(payloadDetails.ends_at, currentEvent.ends_at)
  ) {
    return fail("past_date")
  }

  const slug =
    payloadDetails.title === currentEvent.title
      ? currentEvent.slug
      : slugifyId(payloadDetails.title)

  if (!slug) {
    return fail("generating_slug_failed")
  }

  const payload: EventPayload = {
    ...payloadDetails,
    slug,
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

  revalidateEventConsumers(eventId)
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

  revalidateEventConsumers(eventId)
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

  revalidateEventConsumers()
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

  revalidateEventConsumers()
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
