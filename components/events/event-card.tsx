"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Clock01Icon,
  Image01Icon,
  Location01Icon,
  Wallet01Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useCallback, useEffect, useId, useMemo, useState } from "react"

import { CountryFlag, getCountryOption } from "@/lib/countries"
import {
  formatEventDateTime,
  getEventCta,
  getEventDateStatus,
  hasRtlText,
  type EventDateStatus,
} from "@/lib/events/presentation"
import type { EventFeedItem } from "@/lib/events/types"
import { cn } from "@/lib/utils"

type EventImageItem = {
  alt: string
  src: string
  title: string
}

const DESCRIPTION_PREVIEW_CHARACTER_LIMIT = 280
const DESCRIPTION_PREVIEW_LINE_LIMIT = 4

function EventDescription({ description }: { description: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const descriptionId = useId()
  const trimmedDescription = description.trim()
  const previewDescription = getDescriptionPreview(trimmedDescription)
  const lineCount = trimmedDescription.split(/\r\n|\r|\n/).length
  const hasHiddenContent =
    trimmedDescription.length > DESCRIPTION_PREVIEW_CHARACTER_LIMIT ||
    lineCount > DESCRIPTION_PREVIEW_LINE_LIMIT ||
    previewDescription !== trimmedDescription

  return (
    <div className="mt-3 max-w-3xl">
      <div className="relative min-h-16 overflow-hidden">
        <p
          id={descriptionId}
          className={cn(
            "text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground",
            hasHiddenContent &&
              "max-h-24 overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)]"
          )}
        >
          {previewDescription}
        </p>
      </div>

      {hasHiddenContent ? (
        <button
          type="button"
          aria-controls={descriptionId}
          onClick={() => setIsModalOpen(true)}
          className="mt-2 inline-flex rounded-md text-sm font-medium text-primary transition hover:text-primary/80 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          Read full description
        </button>
      ) : null}

      {isModalOpen ? (
        <DescriptionModal
          description={trimmedDescription}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </div>
  )
}

function getDescriptionPreview(description: string) {
  const normalizedDescription = description
    .replace(/\r\n|\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[\s=_-]{8,}$/gm, "")
    .replace(/[=_-]{8,}/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  if (!normalizedDescription) {
    return description.slice(0, DESCRIPTION_PREVIEW_CHARACTER_LIMIT).trim()
  }

  const lines = normalizedDescription.split("\n")
  const previewLines = lines.slice(0, DESCRIPTION_PREVIEW_LINE_LIMIT)
  let preview = previewLines.join("\n").trim()

  if (preview.length <= DESCRIPTION_PREVIEW_CHARACTER_LIMIT) {
    return preview
  }

  const truncatedPreview = preview.slice(0, DESCRIPTION_PREVIEW_CHARACTER_LIMIT)
  const lastSpaceIndex = truncatedPreview.search(/\s+\S*$/)

  preview =
    lastSpaceIndex > DESCRIPTION_PREVIEW_CHARACTER_LIMIT * 0.7
      ? truncatedPreview.slice(0, lastSpaceIndex)
      : truncatedPreview

  return `${preview.trimEnd()}...`
}

function EventImage({
  alt,
  src,
  className,
  onOpen,
  sizes,
  title,
}: {
  alt: string
  src: string | null
  className?: string
  onOpen?: () => void
  sizes: string
  title: string
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex min-h-72 items-center justify-center rounded-lg border border-border/80 bg-surface-raised text-sm font-medium text-muted-foreground",
          className
        )}
      >
        Event image
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative block w-full min-w-0 overflow-hidden rounded-lg bg-surface-raised text-left focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
        className
      )}
      aria-label={`Open ${title}`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        className="scale-105 object-cover opacity-35 blur-xl transition duration-200 group-hover:scale-110 dark:opacity-30"
        aria-hidden="true"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-contain transition duration-200 group-hover:scale-[1.02]"
      />
    </button>
  )
}

function DetailIcon({ icon }: { icon: typeof Calendar01Icon }) {
  return (
    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/70 text-primary dark:text-accent-warm">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
    </span>
  )
}

function DateLine({ label, value }: { label: string; value: string }) {
  const dateTime = formatEventDateTime(value)

  return (
    <div className="grid gap-0.5">
      <dt className="text-[11px] font-semibold tracking-normal text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="leading-5 wrap-anywhere">
        <span className="font-medium text-foreground">{dateTime.date}</span>
        <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
          <HugeiconsIcon
            icon={Clock01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          {dateTime.time}
        </span>
      </dd>
    </div>
  )
}

function EventStatusChip({ status }: { status: EventDateStatus }) {
  const statusConfig: Record<
    EventDateStatus,
    {
      className: string
      label: string
    }
  > = {
    ended: {
      className: "border-border/70 bg-muted text-muted-foreground",
      label: "Ended",
    },
    today: {
      className:
        "border-accent-warm/35 bg-accent text-accent-foreground dark:bg-accent-warm/20 dark:text-accent-warm",
      label: "Today",
    },
    upcoming: {
      className: "border-border/70 bg-secondary text-secondary-foreground",
      label: "Upcoming",
    },
  }
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1",
        config.className
      )}
    >
      <span
        className="size-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}

function MetadataChip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1",
        className
      )}
    >
      {children}
    </span>
  )
}

function EventPriceChip({ event }: { event: EventFeedItem }) {
  const label =
    event.price_type === "paid" ? event.price_text?.trim() || "Paid" : "Free"

  return (
    <MetadataChip className="border-border/70 bg-surface-raised text-foreground">
      <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-3.5" />
      <span>{label}</span>
    </MetadataChip>
  )
}

function DescriptionModal({
  description,
  onClose,
}: {
  description: string
  onClose: () => void
}) {
  const titleId = useId()
  const descriptionId = useId()
  const hasRtlContent = hasRtlText(description)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="grid max-h-[88svh] w-full max-w-3xl min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-border/80 bg-card shadow-2xl shadow-black/35">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 p-4">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="truncate text-base font-semibold text-foreground"
            >
              Event description
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Full event details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-raised text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            aria-label="Close description"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <p
            id={descriptionId}
            dir={hasRtlContent ? "rtl" : "ltr"}
            className={cn(
              "text-sm leading-7 wrap-anywhere whitespace-pre-line text-muted-foreground",
              hasRtlContent && "text-right"
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function ImageModal({
  activeIndex,
  images,
  loadedImageSrcs,
  onClose,
  onImageLoad,
  onSelect,
}: {
  activeIndex: number
  images: EventImageItem[]
  loadedImageSrcs: Set<string>
  onClose: () => void
  onImageLoad: (src: string) => void
  onSelect: (index: number) => void
}) {
  const activeImage = images[activeIndex]
  const hasMultipleImages = images.length > 1
  const isActiveImageLoaded = activeImage
    ? loadedImageSrcs.has(activeImage.src)
    : false
  const goPrevious = useCallback(() => {
    onSelect((activeIndex - 1 + images.length) % images.length)
  }, [activeIndex, images.length, onSelect])
  const goNext = useCallback(() => {
    onSelect((activeIndex + 1) % images.length)
  }, [activeIndex, images.length, onSelect])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        goPrevious()
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        goNext()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [goNext, goPrevious, hasMultipleImages, onClose])

  useEffect(() => {
    if (!activeImage) {
      return
    }

    const preloadIndexes = hasMultipleImages
      ? [
          activeIndex,
          (activeIndex - 1 + images.length) % images.length,
          (activeIndex + 1) % images.length,
        ]
      : [activeIndex]

    preloadIndexes.forEach((index) => {
      const image = images[index]

      if (!image || loadedImageSrcs.has(image.src)) {
        return
      }

      const preloadImage = new window.Image()
      preloadImage.src = image.src
    })
  }, [activeImage, activeIndex, hasMultipleImages, images, loadedImageSrcs])

  if (!activeImage) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${activeImage.title} image preview`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="grid max-h-full w-full max-w-6xl min-w-0 gap-3">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-white">
          <p className="min-w-0 truncate text-sm font-medium">
            {activeImage.title}
            {hasMultipleImages
              ? ` (${activeIndex + 1} of ${images.length})`
              : ""}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-sm font-medium transition hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
            aria-label="Close image preview"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </div>

        <div className="relative h-[68svh] min-h-80 overflow-hidden rounded-lg bg-black sm:h-[72vh]">
          <Image
            src={activeImage.src}
            alt=""
            fill
            sizes="(max-width: 768px) 80vw, 24vw"
            className={cn(
              "scale-110 object-cover opacity-45 blur-2xl transition-opacity duration-300",
              isActiveImageLoaded ? "opacity-0" : "opacity-45"
            )}
            aria-hidden="true"
          />

          {!isActiveImageLoaded ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
              <div className="flex items-center gap-3 rounded-md bg-black/60 px-4 py-3 text-sm font-medium text-white shadow-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Loading image</span>
              </div>
              <span className="sr-only">Loading image</span>
            </div>
          ) : null}

          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            sizes="100vw"
            className={cn(
              "object-contain transition-opacity duration-300",
              isActiveImageLoaded ? "opacity-100" : "opacity-0"
            )}
            priority
            onLoad={() => onImageLoad(activeImage.src)}
          />

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 text-white transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none sm:inline-flex"
                aria-label="Show previous image"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  className="size-5"
                />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 text-white transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none sm:inline-flex"
                aria-label="Show next image"
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-5"
                />
              </button>
            </>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 text-white sm:hidden">
            <button
              type="button"
              onClick={goPrevious}
              className="inline-flex size-10 items-center justify-center rounded-md bg-white/10 transition hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
              aria-label="Show previous image"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                className="size-5"
              />
            </button>
            <p className="text-center text-xs font-semibold text-white/80">
              {activeIndex + 1} / {images.length}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex size-10 items-center justify-center rounded-md bg-white/10 transition hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
              aria-label="Show next image"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-5"
              />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function EventCard({ event }: { event: EventFeedItem }) {
  const cta = getEventCta(event)
  const country = getCountryOption(event.country_code)
  const eventLocation = [event.city, country?.name].filter(Boolean).join(", ")
  const galleryImages = event.images.filter(
    (image) => image && image !== event.cover_image_url
  )
  const hasImages = Boolean(event.cover_image_url || galleryImages.length > 0)
  const imageCount = (event.cover_image_url ? 1 : 0) + galleryImages.length
  const hasRtlContent = hasRtlText(event.title) || hasRtlText(event.description)
  const dateStatus = getEventDateStatus(event)
  const imageItems = useMemo<EventImageItem[]>(() => {
    const coverImage = event.cover_image_url
      ? [
          {
            alt: `${event.title} cover image`,
            src: event.cover_image_url,
            title: `${event.title} cover image`,
          },
        ]
      : []

    return [
      ...coverImage,
      ...galleryImages.map((image, index) => ({
        alt: `${event.title} gallery image ${index + 1}`,
        src: image,
        title: `${event.title} gallery image ${index + 1}`,
      })),
    ]
  }, [event.cover_image_url, event.title, galleryImages])
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
  const [loadedModalImageSrcs, setLoadedModalImageSrcs] = useState<Set<string>>(
    () => new Set()
  )

  function markModalImageLoaded(src: string) {
    setLoadedModalImageSrcs((currentSrcs) => {
      if (currentSrcs.has(src)) {
        return currentSrcs
      }

      const nextSrcs = new Set(currentSrcs)
      nextSrcs.add(src)
      return nextSrcs
    })
  }

  return (
    <article className="grid w-full min-w-0 gap-5 overflow-hidden rounded-lg border border-border/80 bg-card p-4 shadow-lg shadow-black/15 lg:grid-cols-[minmax(300px,0.55fr)_1fr] lg:p-5">
      <div className="grid min-w-0 gap-3">
        <EventImage
          alt={`${event.title} cover image`}
          src={event.cover_image_url}
          title={`${event.title} cover image`}
          sizes="(max-width: 1024px) calc(100vw - 2rem), 42vw"
          className="aspect-square min-h-72 md:min-h-80 lg:min-h-96"
          onOpen={
            event.cover_image_url ? () => setActiveImageIndex(0) : undefined
          }
        />
      </div>

      <div className="flex min-w-0 flex-col gap-5 lg:min-h-full lg:justify-between">
        <div className="grid min-w-0 gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-normal text-muted-foreground uppercase">
            {event.categories?.name ? (
              <span className="rounded-md border border-accent-warm/20 bg-accent px-2 py-1 text-accent-foreground">
                {event.categories.name}
              </span>
            ) : null}
            <EventStatusChip status={dateStatus} />
            <span className="rounded-md border border-border/70 bg-secondary px-2 py-1 text-secondary-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CountryFlag
                  code={event.country_code}
                  className="h-3.5 w-5 rounded-[2px] shadow-sm ring-1 ring-border/70"
                />
                <span>
                  {country ? `${event.city}, ${country.name}` : event.city}
                </span>
              </span>
            </span>
            <EventPriceChip event={event} />
            {event.is_online ? (
              <MetadataChip className="border-primary/25 bg-primary/10 text-primary dark:border-accent-warm/35 dark:bg-accent-warm/15 dark:text-accent-warm">
                <HugeiconsIcon
                  icon={Wifi01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
                <span>Online</span>
              </MetadataChip>
            ) : null}
          </div>

          <div
            dir={hasRtlContent ? "rtl" : "ltr"}
            className={cn("min-w-0", hasRtlContent && "text-right")}
          >
            <h2 className="text-2xl leading-tight font-semibold tracking-normal text-foreground">
              {event.title}
            </h2>
            {event.description ? (
              <EventDescription description={event.description} />
            ) : null}
          </div>

          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div className="flex gap-3 rounded-md border border-border/70 bg-surface-raised p-3.5">
              <DetailIcon icon={Calendar01Icon} />
              <div className="grid min-w-0 gap-3">
                <DateLine label="Starts at" value={event.starts_at} />
                {event.ends_at ? (
                  <DateLine label="Ends at" value={event.ends_at} />
                ) : null}
              </div>
            </div>

            <div className="flex gap-3 rounded-md border border-border/70 bg-surface-raised p-3.5">
              <DetailIcon icon={Location01Icon} />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold tracking-normal text-muted-foreground uppercase">
                  Location
                </dt>
                <dd className="mt-1 grid gap-1 leading-5 wrap-anywhere">
                  {event.location ? (
                    <span className="font-medium text-foreground">
                      {event.location}
                    </span>
                  ) : null}
                  <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5 text-muted-foreground">
                    <CountryFlag
                      code={event.country_code}
                      className="h-4 w-6 shrink-0 rounded-[2px] shadow-sm ring-1 ring-border/70"
                    />
                    <span>{eventLocation || event.city}</span>
                  </span>
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {cta || hasImages ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {cta ? (
              <a
                href={cta.href}
                target={
                  event.cta_type === "external_link" ||
                  event.cta_type === "whatsapp"
                    ? "_blank"
                    : undefined
                }
                rel={
                  event.cta_type === "external_link" ||
                  event.cta_type === "whatsapp"
                    ? "noreferrer"
                    : undefined
                }
                className="inline-flex min-h-10 max-w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {cta.label}
              </a>
            ) : null}

            {hasImages ? (
              <button
                type="button"
                onClick={() => setActiveImageIndex(0)}
                className="inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-md border border-border/80 bg-surface-raised px-4 py-2 text-center text-sm font-medium text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <HugeiconsIcon
                  icon={Image01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <span>View images</span>
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {imageCount}
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {activeImageIndex !== null ? (
        <ImageModal
          activeIndex={activeImageIndex}
          images={imageItems}
          loadedImageSrcs={loadedModalImageSrcs}
          onClose={() => setActiveImageIndex(null)}
          onImageLoad={markModalImageLoaded}
          onSelect={setActiveImageIndex}
        />
      ) : null}
    </article>
  )
}
