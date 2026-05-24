"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { CountryCombobox } from "@/components/admin/country-combobox"
import { DatePicker } from "@/components/admin/date-picker"
import {
  EventCtaInput,
  type EventCtaInputHandle,
} from "@/components/admin/event-cta-input"
import { ImageSelector } from "@/components/admin/image-selector"
import { useEventDateRange } from "@/hooks/use-event-date-range"
import {
  buildEventCoverImagePath,
  buildEventGalleryImagePath,
  EVENT_IMAGE_BUCKET,
  type CategoryOption,
  type EventFormEvent,
} from "@/lib/admin/events"
import { formatImageSize, optimizeImage } from "@/lib/images/optimize"
import {
  removePublicFiles,
  uploadPublicFile,
  type UploadedPublicFile,
} from "@/lib/supabase/storage-client"

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
  missing_fields: "Fill in the required event fields.",
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

const inputClassName =
  "min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"

function Field({
  children,
  label,
  required,
}: {
  children: React.ReactNode
  label: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

function SubmitButton({
  label,
  processing,
}: {
  label: string
  processing: boolean
}) {
  return (
    <button
      type="submit"
      disabled={processing}
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
    >
      {processing ? "Working..." : label}
    </button>
  )
}

function getImageExtension(file: File) {
  return file.type === "image/webp" ? "webp" : "jpg"
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

  async function optimizeFiles(files: File[]) {
    const optimizedFiles: File[] = []
    let originalTotal = 0
    let optimizedTotal = 0

    for (const file of files) {
      setProgressDetail(`Optimizing ${file.name}`)
      const optimized = await optimizeImage(file)
      optimizedFiles.push(optimized.file)
      originalTotal += optimized.originalSize
      optimizedTotal += optimized.optimizedSize
    }

    if (optimizedFiles.length > 0) {
      setOptimizationSummary(
        `Optimized ${optimizedFiles.length} image${optimizedFiles.length === 1 ? "" : "s"} from ${formatImageSize(
          originalTotal
        )} to ${formatImageSize(optimizedTotal)}.`
      )
    }

    return optimizedFiles
  }

  async function uploadImages({
    cover,
    eventId,
    gallery,
  }: {
    cover: File[]
    eventId: string
    gallery: File[]
  }) {
    const uploadedPaths: string[] = []
    let uploadedCover: UploadedPublicFile | null = null
    const uploadedGallery: UploadedPublicFile[] = []

    if (cover[0]) {
      setProgressDetail("Uploading cover image")
      try {
        uploadedCover = await uploadPublicFile({
          bucket: EVENT_IMAGE_BUCKET,
          file: cover[0],
          path: buildEventCoverImagePath(eventId, getImageExtension(cover[0])),
        })
        uploadedPaths.push(uploadedCover.path)
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "upload_failed",
          uploadedCover,
          uploadedGallery,
          uploadedPaths,
        }
      }
    }

    for (const [index, file] of gallery.entries()) {
      setProgressDetail(
        `Uploading gallery image ${index + 1} of ${gallery.length}`
      )
      try {
        const uploaded = await uploadPublicFile({
          bucket: EVENT_IMAGE_BUCKET,
          file,
          path: buildEventGalleryImagePath({
            eventId,
            extension: getImageExtension(file),
            fileName: file.name,
            index: index + 1,
          }),
        })
        uploadedGallery.push(uploaded)
        uploadedPaths.push(uploaded.path)
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "upload_failed",
          uploadedCover,
          uploadedGallery,
          uploadedPaths,
        }
      }
    }

    return { uploadedCover, uploadedGallery, uploadedPaths }
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
      const uploadedImages = await uploadImages({
        eventId,
        cover: optimizedCoverFiles,
        gallery: optimizedGalleryFiles,
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
      const optimizedCoverFiles = await optimizeFiles(coverFiles)
      const optimizedGalleryFiles = await optimizeFiles(galleryFiles)
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
      const optimizedCoverFiles = await optimizeFiles(coverFiles)
      const optimizedGalleryFiles = await optimizeFiles(galleryFiles)
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
      {message ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">
            Core details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These fields control how the event appears publicly.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" required>
            <input
              className={inputClassName}
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </Field>

          <Field label="Category" required>
            <select
              className={inputClassName}
              name="category_id"
              defaultValue={event?.category_id ?? ""}
              required
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            className={`${inputClassName} min-h-32 resize-y`}
            name="description"
            defaultValue={event?.description ?? ""}
          />
        </Field>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">
            When and where
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dates, city, and venue details shown on event cards.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City" required>
              <input
                className={inputClassName}
                name="city"
                defaultValue={event?.city ?? ""}
                required
              />
            </Field>

            <Field label="Country">
              <CountryCombobox defaultValue={event?.country_code} />
            </Field>
          </div>

          <Field label="Location">
            <input
              className={inputClassName}
              name="location"
              defaultValue={event?.location ?? ""}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Starts at" required>
              <DatePicker
                name="starts_at"
                value={startsAt}
                onChange={handleStartsAtChange}
                required
              />
            </Field>

            <Field label="Ends at">
              <DatePicker
                key={endsAtPickerKey}
                error={
                  hasInvalidEndDate
                    ? "End date must be after the start date."
                    : undefined
                }
                name="ends_at"
                value={endsAt}
                onChange={handleEndsAtChange}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Images</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Images are optimized before uploading.
          </p>
        </div>

        <ImageSelector
          label="Cover image"
          description="Use one strong image for the event card hero."
          existingImages={existingCoverImages}
          onExistingChange={setKeptCoverUrls}
          onFilesChange={setCoverFiles}
        />

        <ImageSelector
          label="Gallery images"
          description="Add supporting images that appear under the cover."
          multiple
          existingImages={existingGalleryImages}
          onExistingChange={setKeptGalleryUrls}
          onFilesChange={setGalleryFiles}
        />
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">
            Call to action
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how visitors can contact or book.
          </p>
        </div>

        <EventCtaInput ref={ctaInputRef} event={event} />
      </section>

      {progressStage !== "idle" ? (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {progressLabels[progressStage]}
            </p>
            {processing ? (
              <p className="text-xs text-muted-foreground">
                Please keep this page open.
              </p>
            ) : null}
          </div>
          {progressDetail ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {progressDetail}
            </p>
          ) : null}
          {optimizationSummary ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {optimizationSummary}
            </p>
          ) : null}
          {processing ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          label={event ? "Save event" : "Create event"}
          processing={processing}
        />
        <a
          href="/admin/events"
          className={`inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none ${
            processing ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
