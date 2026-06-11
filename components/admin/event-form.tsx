"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { type EventCtaInputHandle } from "@/components/admin/event-cta-input"
import {
  EventCoreDetailsSection,
  EventCtaSection,
  EventDateLocationSection,
  EventImagesSection,
  EventPriceFormatSection,
  EventProgressPanel,
} from "@/components/admin/event-form-sections"
import { ErrorNotice, SubmitButton } from "@/components/layout/page-shell"
import { buttonVariants } from "@/components/ui/button"
import { useEventDateRange } from "@/hooks/use-event-date-range"
import {
  EVENT_IMAGE_BUCKET,
  type CategoryOption,
  type EventFormEvent,
} from "@/lib/admin/events"
import { removePublicFiles } from "@/lib/supabase/storage-client"
import { cn } from "@/lib/utils"

import {
  getOptimizationSummary,
  optimizeEventImages,
  uploadEventImages,
} from "./event-image-workflow"

type EventActionResult = {
  eventId?: string
  error?: string
  ok: boolean
}

type EventFormProps = {
  action: (formData: FormData) => Promise<EventActionResult>
  categories: CategoryOption[]
  cleanupAction: (paths: string[]) => Promise<EventActionResult>
  event?: EventFormEvent
  error?: string | null
  imageAction?: (
    eventId: string,
    formData: FormData
  ) => Promise<EventActionResult>
}

type ProgressStage =
  | "idle"
  | "validating"
  | "optimizing"
  | "uploading"
  | "saving"
  | "cleaning"
  | "done"
  | "error"

const errorMessages: Record<string, string> = {
  cleanup_failed:
    "The event could not be saved and uploaded images could not be fully cleaned up.",
  image_too_large: "Images must be 5MB or smaller.",
  image_optimization_failed: "One or more images could not be optimized.",
  invalid_date: "Use valid event dates.",
  invalid_date_range: "The end date must be after the start date.",
  invalid_image_type: "Upload PNG, JPG, or WebP images only.",
  invalid_cta_phone: "Use digits only for phone and WhatsApp CTAs.",
  invalid_cta_url: "Use a valid HTTP or HTTPS URL.",
  invalid_country: "Select a valid country from the list.",
  missing_cta_phone: "Phone and WhatsApp CTAs require a phone number.",
  missing_cta_url: "External link CTAs require a URL.",
  missing_event: "The selected event could not be found.",
  generating_slug_failed:
    "Could not generate a valid slug for the event. Please try again.",
  missing_fields: "Fill in the required event fields.",
  past_date: "Use today or a future date.",
  save_failed: "The event could not be saved.",
  upload_failed: "One or more images could not be uploaded.",
}

const progressLabels: Record<ProgressStage, string> = {
  cleaning: "Cleaning uploaded images...",
  done: "Event saved.",
  error: "Something went wrong.",
  idle: "",
  optimizing: "Optimizing images...",
  saving: "Saving event...",
  uploading: "Uploading images...",
  validating: "Validating form...",
}

function getTodayStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function EventForm({
  action,
  categories,
  cleanupAction,
  event,
  error,
  imageAction,
}: EventFormProps) {
  const router = useRouter()
  const ctaInputRef = useRef<EventCtaInputHandle>(null)
  const minEventDate = useMemo(() => getTodayStart(), [])
  const [title, setTitle] = useState(event?.title ?? "")
  const {
    endsAt,
    endsAtPickerKey,
    handleEndsAtChange,
    handleStartsAtChange,
    hasInvalidEndDate,
    startsAt,
  } = useEventDateRange({
    endsAt: event?.ends_at ?? null,
    startsAt: event?.starts_at ?? null,
  })
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [keptCoverUrls, setKeptCoverUrls] = useState<string[]>(
    event?.cover_image_url ? [event.cover_image_url] : []
  )
  const [keptGalleryUrls, setKeptGalleryUrls] = useState<string[]>(
    event?.images ?? []
  )
  const [progressStage, setProgressStage] = useState<ProgressStage>("idle")
  const [progressDetail, setProgressDetail] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [optimizationSummary, setOptimizationSummary] = useState<string | null>(
    null
  )

  const message = submitError
    ? errorMessages[submitError] || submitError
    : error
      ? errorMessages[error]
      : null
  const existingCoverImages = useMemo(
    () =>
      event?.cover_image_url
        ? [
            {
              url: event.cover_image_url,
              label: "Current cover image",
            },
          ]
        : [],
    [event]
  )
  const existingGalleryImages = useMemo(
    () =>
      event?.images.map((image, index) => ({
        url: image,
        label: `Gallery image ${index + 1}`,
      })) ?? [],
    [event]
  )
  const processing = !["idle", "done", "error"].includes(progressStage)

  async function cleanupUploadedImages(paths: string[]) {
    if (paths.length === 0) {
      return
    }

    setProgressStage("cleaning")
    setProgressDetail(
      "Removing files that were uploaded before the save failed."
    )

    try {
      await removePublicFiles(EVENT_IMAGE_BUCKET, paths)
    } catch {
      await cleanupAction(paths)
    }
  }

  async function optimizeSelectedImages() {
    const coverFileCount = coverFiles.length
    const result = await optimizeEventImages(
      [...coverFiles, ...galleryFiles],
      (file) => setProgressDetail(`Optimizing ${file.name}`)
    )
    const summary = getOptimizationSummary({
      optimizedTotal: result.optimizedTotal,
      originalTotal: result.originalTotal,
      totalFiles: result.files.length,
    })

    if (summary) {
      setOptimizationSummary(summary)
    }

    return {
      optimizedCoverFiles: result.files.slice(0, coverFileCount),
      optimizedGalleryFiles: result.files.slice(coverFileCount),
    }
  }

  async function handleSubmit(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (processing) {
      return
    }

    const form = submitEvent.currentTarget
    setSubmitError(null)
    setOptimizationSummary(null)
    setProgressStage("validating")
    setProgressDetail("Checking required fields and selected images.")

    if (!form.reportValidity()) {
      setProgressStage("error")
      setSubmitError("missing_fields")
      return
    }

    if (hasInvalidEndDate) {
      setProgressStage("error")
      setSubmitError("invalid_date_range")
      return
    }

    if (!ctaInputRef.current?.validate()) {
      setProgressStage("error")
      setSubmitError("invalid_cta_url")
      return
    }

    const formData = new FormData(form)
    formData.delete("cover_image")
    formData.delete("gallery_images")
    formData.delete("existing_images")
    formData.delete("existing_cover_image_url")
    formData.delete("keep_cover_image")
    formData.delete("cover_image_url")
    formData.delete("images")
    formData.delete("removed_image_urls")

    if (!event) {
      await handleCreateSubmit(formData)
      return
    }

    await handleEditSubmit(formData, event)
  }

  async function appendImageUrls({
    eventId,
    formData,
    optimizedCoverFiles,
    optimizedGalleryFiles,
  }: {
    eventId: string
    formData: FormData
    optimizedCoverFiles: File[]
    optimizedGalleryFiles: File[]
  }) {
    const uploadedPaths: string[] = []

    try {
      setProgressStage("uploading")
      const uploadedImages = await uploadEventImages({
        eventId,
        cover: optimizedCoverFiles,
        gallery: optimizedGalleryFiles,
        onProgress: setProgressDetail,
      })
      uploadedPaths.push(...uploadedImages.uploadedPaths)

      const finalCoverUrl =
        uploadedImages.uploadedCover?.publicUrl ?? keptCoverUrls[0] ?? null
      const finalGalleryUrls = [
        ...keptGalleryUrls,
        ...uploadedImages.uploadedGallery.map((image) => image.publicUrl),
      ]
      const removedImageUrls = event
        ? [
            ...(event.cover_image_url && event.cover_image_url !== finalCoverUrl
              ? [event.cover_image_url]
              : []),
            ...event.images.filter((image) => !keptGalleryUrls.includes(image)),
          ]
        : []

      if (finalCoverUrl) {
        formData.set("cover_image_url", finalCoverUrl)
      }

      finalGalleryUrls.forEach((url) => formData.append("images", url))
      removedImageUrls.forEach((url) =>
        formData.append("removed_image_urls", url)
      )

      return {
        error: uploadedImages.error,
        ok: !uploadedImages.error,
        uploadedPaths,
      } as const
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "upload_failed",
        ok: false,
        uploadedPaths,
      } as const
    }
  }

  async function handleCreateSubmit(formData: FormData) {
    setProgressStage("saving")
    setProgressDetail("Creating event record.")
    const createResult = await action(formData)

    if (!createResult.ok || !createResult.eventId) {
      setProgressStage("error")
      setSubmitError(createResult.error ?? "save_failed")
      return
    }

    const eventId = createResult.eventId
    const imageFormData = new FormData()

    try {
      setProgressStage("optimizing")
      const { optimizedCoverFiles, optimizedGalleryFiles } =
        await optimizeSelectedImages()
      const imageResult = await appendImageUrls({
        eventId,
        formData: imageFormData,
        optimizedCoverFiles,
        optimizedGalleryFiles,
      })

      if (!imageResult.ok) {
        if (imageResult.uploadedPaths.length > 0 && imageAction) {
          await imageAction(eventId, imageFormData)
        }

        router.push("/admin/events/" + eventId + "/edit?error=upload_failed")
        router.refresh()
        return
      }

      if (imageAction) {
        setProgressStage("saving")
        setProgressDetail("Saving event images to the database.")
        const updateImagesResult = await imageAction(eventId, imageFormData)

        if (!updateImagesResult.ok) {
          router.push(
            `/admin/events/${eventId}/edit?error=${updateImagesResult.error ?? "upload_failed"}`
          )
          router.refresh()
          return
        }
      }

      setProgressStage("done")
      setProgressDetail("Redirecting to events management.")
      router.push("/admin/events")
      router.refresh()
    } catch {
      router.push("/admin/events/" + eventId + "/edit?error=upload_failed")
      router.refresh()
    }
  }

  async function handleEditSubmit(
    formData: FormData,
    currentEvent: EventFormEvent
  ) {
    const uploadedPaths: string[] = []

    try {
      setProgressStage("optimizing")
      const { optimizedCoverFiles, optimizedGalleryFiles } =
        await optimizeSelectedImages()
      const imageResult = await appendImageUrls({
        eventId: currentEvent.id,
        formData,
        optimizedCoverFiles,
        optimizedGalleryFiles,
      })

      if (!imageResult.ok) {
        await cleanupUploadedImages(imageResult.uploadedPaths)
        setProgressStage("error")
        setSubmitError(imageResult.error ?? "upload_failed")
        return
      }

      uploadedPaths.push(...imageResult.uploadedPaths)

      setProgressStage("saving")
      setProgressDetail("Saving event details to the database.")
      const result = await action(formData)

      if (!result.ok) {
        await cleanupUploadedImages(uploadedPaths)
        setProgressStage("error")
        setSubmitError(result.error ?? "save_failed")
        return
      }

      setProgressStage("done")
      setProgressDetail("Redirecting to events management.")
      router.push("/admin/events")
      router.refresh()
    } catch (error) {
      await cleanupUploadedImages(uploadedPaths)
      setProgressStage("error")
      setSubmitError(error instanceof Error ? error.message : "upload_failed")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <ErrorNotice message={message} />

      <EventCoreDetailsSection
        categories={categories}
        event={event}
        title={title}
        onTitleChange={setTitle}
      />

      <EventDateLocationSection
        endsAt={endsAt}
        endsAtPickerKey={endsAtPickerKey}
        event={event}
        handleEndsAtChange={handleEndsAtChange}
        handleStartsAtChange={handleStartsAtChange}
        hasInvalidEndDate={hasInvalidEndDate}
        minEventDate={minEventDate}
        startsAt={startsAt}
      />

      <EventPriceFormatSection event={event} />

      <EventImagesSection
        existingCoverImages={existingCoverImages}
        existingGalleryImages={existingGalleryImages}
        onCoverFilesChange={setCoverFiles}
        onGalleryFilesChange={setGalleryFiles}
        onKeptCoverChange={setKeptCoverUrls}
        onKeptGalleryChange={setKeptGalleryUrls}
      />

      <EventCtaSection ctaInputRef={ctaInputRef} event={event} />

      {progressStage !== "idle" ? (
        <EventProgressPanel
          detail={progressDetail}
          label={progressLabels[progressStage]}
          optimizationSummary={optimizationSummary}
          processing={processing}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton processing={processing}>
          {event ? "Save event" : "Create event"}
        </SubmitButton>
        <a
          href="/admin/events"
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            processing && "pointer-events-none opacity-50"
          )}
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
