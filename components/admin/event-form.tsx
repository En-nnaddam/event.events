"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DatePicker } from "@/components/admin/date-picker"
import { ImageSelector } from "@/components/admin/image-selector"
import { useEventDateRange } from "@/hooks/use-event-date-range"
import {
  EVENT_IMAGE_BUCKET,
  getEventCtaLabel,
  slugify,
  type AdminEventRow,
  type CategoryOption,
  type EventCtaType,
} from "@/lib/admin/events"
import { formatImageSize, optimizeImage } from "@/lib/images/optimize"
import { removePublicFiles, uploadPublicFile, type UploadedPublicFile } from "@/lib/supabase/storage-client"

type EventActionResult = {
  error?: string
  ok: boolean
}

type EventFormProps = {
  action: (formData: FormData) => Promise<EventActionResult>
  categories: CategoryOption[]
  cleanupAction: (paths: string[]) => Promise<EventActionResult>
  event?: AdminEventRow
  error?: string | null
}

type ProgressStage = "idle" | "validating" | "optimizing" | "uploading" | "saving" | "cleaning" | "done" | "error"

const errorMessages: Record<string, string> = {
  cleanup_failed: "The event could not be saved and uploaded images could not be fully cleaned up.",
  image_too_large: "Images must be 5MB or smaller.",
  image_optimization_failed: "One or more images could not be optimized.",
  invalid_date: "Use valid event dates.",
  invalid_date_range: "The end date must be after the start date.",
  invalid_image_type: "Upload PNG, JPG, WebP, or GIF images only.",
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

function SubmitButton({ label, processing }: { label: string; processing: boolean }) {
  return (
    <button
      type="submit"
      disabled={processing}
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
    >
      {processing ? "Working..." : label}
    </button>
  )
}

function sanitizeStorageName(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getImageExtension(file: File) {
  return file.type === "image/webp" ? "webp" : "jpg"
}

export function EventForm({ action, categories, cleanupAction, event, error }: EventFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(event?.title ?? "")
  const { endsAt, endsAtPickerKey, handleEndsAtChange, handleStartsAtChange, hasInvalidEndDate, startsAt } =
    useEventDateRange({
      endsAt: event?.ends_at ?? null,
      startsAt: event?.starts_at ?? null,
    })
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [keptCoverUrls, setKeptCoverUrls] = useState<string[]>(event?.cover_image_url ? [event.cover_image_url] : [])
  const [keptGalleryUrls, setKeptGalleryUrls] = useState<string[]>(event?.images ?? [])
  const [ctaType, setCtaType] = useState<EventCtaType>(event?.cta_type ?? "none")
  const [progressStage, setProgressStage] = useState<ProgressStage>("idle")
  const [progressDetail, setProgressDetail] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [optimizationSummary, setOptimizationSummary] = useState<string | null>(null)

  const slug = event?.slug || slugify(title)
  const submittedCtaLabel = getEventCtaLabel(ctaType)
  const message = submitError ? errorMessages[submitError] || submitError : error ? errorMessages[error] : null
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
    setProgressDetail("Removing files that were uploaded before the save failed.")

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
      uploadedCover = await uploadPublicFile({
        bucket: EVENT_IMAGE_BUCKET,
        file: cover[0],
        path: `events/${eventId}/cover-${Date.now()}.${getImageExtension(cover[0])}`,
      })
      uploadedPaths.push(uploadedCover.path)
    }

    for (const [index, file] of gallery.entries()) {
      setProgressDetail(`Uploading gallery image ${index + 1} of ${gallery.length}`)
      const uploaded = await uploadPublicFile({
        bucket: EVENT_IMAGE_BUCKET,
        file,
        path: `events/${eventId}/gallery/${Date.now()}-${index + 1}-${sanitizeStorageName(file.name)}.${getImageExtension(file)}`,
      })
      uploadedGallery.push(uploaded)
      uploadedPaths.push(uploaded.path)
    }

    return { uploadedCover, uploadedGallery, uploadedPaths }
  }

  async function handleSubmit(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (processing) {
      return
    }

    const form = submitEvent.currentTarget
    const uploadedPaths: string[] = []

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

    const eventId = event?.id ?? crypto.randomUUID()
    const formData = new FormData(form)
    formData.set("event_id", eventId)
    formData.set("slug", event?.slug || slugify(title))
    formData.set("status", event?.status ?? "published")
    formData.delete("cover_image")
    formData.delete("gallery_images")
    formData.delete("existing_images")
    formData.delete("existing_cover_image_url")
    formData.delete("keep_cover_image")
    formData.delete("cover_image_url")
    formData.delete("images")
    formData.delete("removed_image_urls")

    try {
      setProgressStage("optimizing")
      const optimizedCoverFiles = await optimizeFiles(coverFiles)
      const optimizedGalleryFiles = await optimizeFiles(galleryFiles)

      setProgressStage("uploading")
      const uploadedImages = await uploadImages({
        cover: optimizedCoverFiles,
        eventId,
        gallery: optimizedGalleryFiles,
      })
      uploadedPaths.push(...uploadedImages.uploadedPaths)

      const finalCoverUrl = uploadedImages.uploadedCover?.publicUrl ?? keptCoverUrls[0] ?? null
      const finalGalleryUrls = [
        ...keptGalleryUrls,
        ...uploadedImages.uploadedGallery.map((image) => image.publicUrl),
      ]
      const removedImageUrls = event
        ? [
            ...(event.cover_image_url && event.cover_image_url !== finalCoverUrl ? [event.cover_image_url] : []),
            ...event.images.filter((image) => !keptGalleryUrls.includes(image)),
          ]
        : []

      if (finalCoverUrl) {
        formData.set("cover_image_url", finalCoverUrl)
      }

      finalGalleryUrls.forEach((url) => formData.append("images", url))
      removedImageUrls.forEach((url) => formData.append("removed_image_urls", url))

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
      {event ? <input type="hidden" name="event_id" value={event.id} /> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="status" value={event?.status ?? "published"} />

      {message ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Core details</h2>
          <p className="mt-1 text-sm text-muted-foreground">These fields control how the event appears publicly.</p>
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
            <select className={inputClassName} name="category_id" defaultValue={event?.category_id ?? ""} required>
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
          <h2 className="text-lg font-semibold tracking-normal">When and where</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dates, city, and venue details shown on event cards.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City" required>
            <input className={inputClassName} name="city" defaultValue={event?.city ?? ""} required />
          </Field>

          <Field label="Location">
            <input className={inputClassName} name="location" defaultValue={event?.location ?? ""} />
          </Field>

          <Field label="Starts at" required>
            <DatePicker name="starts_at" value={startsAt} onChange={handleStartsAtChange} required />
          </Field>

          <Field label="Ends at">
            <DatePicker
              key={endsAtPickerKey}
              error={hasInvalidEndDate ? "End date must be after the start date." : undefined}
              name="ends_at"
              value={endsAt}
              onChange={handleEndsAtChange}
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Images</h2>
          <p className="mt-1 text-sm text-muted-foreground">Images are optimized before uploading.</p>
        </div>

        <ImageSelector
          label="Cover image"
          description="Use one strong image for the event card hero."
          name="cover_image"
          existingImages={existingCoverImages}
          onExistingChange={setKeptCoverUrls}
          onFilesChange={setCoverFiles}
          singleExistingUrlName="existing_cover_image_url"
          singleKeepName="keep_cover_image"
        />

        <ImageSelector
          label="Gallery images"
          description="Add supporting images that appear under the cover."
          name="gallery_images"
          multiple
          existingInputName="existing_images"
          existingImages={existingGalleryImages}
          onExistingChange={setKeptGalleryUrls}
          onFilesChange={setGalleryFiles}
        />
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Call to action</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose how visitors can contact or book.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="CTA type">
            <select
              className={inputClassName}
              name="cta_type"
              value={ctaType}
              onChange={(event) => setCtaType(event.target.value as EventCtaType)}
            >
              <option value="none">None</option>
              <option value="external_link">External link</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Phone</option>
            </select>
          </Field>

          {ctaType !== "none" ? (
            <>
              <input type="hidden" name="cta_label" value={submittedCtaLabel} />
              <Field label="CTA label">
                <input className={inputClassName} value={submittedCtaLabel} readOnly />
              </Field>

              {ctaType === "external_link" ? (
                <>
                  <Field label="CTA URL" required>
                    <input className={inputClassName} name="cta_url" type="url" defaultValue={event?.cta_url ?? ""} required />
                  </Field>
                  <input type="hidden" name="cta_phone" value="" />
                </>
              ) : (
                <>
                  <Field label="CTA phone" required>
                    <input className={inputClassName} name="cta_phone" defaultValue={event?.cta_phone ?? ""} required />
                  </Field>
                  <input type="hidden" name="cta_url" value="" />
                </>
              )}
            </>
          ) : (
            <>
              <input type="hidden" name="cta_label" value="" />
              <input type="hidden" name="cta_url" value="" />
              <input type="hidden" name="cta_phone" value="" />
            </>
          )}
        </div>
      </section>

      {progressStage !== "idle" ? (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{progressLabels[progressStage]}</p>
            {processing ? <p className="text-xs text-muted-foreground">Please keep this page open.</p> : null}
          </div>
          {progressDetail ? <p className="mt-2 text-sm text-muted-foreground">{progressDetail}</p> : null}
          {optimizationSummary ? <p className="mt-2 text-sm text-muted-foreground">{optimizationSummary}</p> : null}
          {processing ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={event ? "Save event" : "Create event"} processing={processing} />
        <a
          href="/admin/events"
          className={`inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 ${
            processing ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
