"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Clock01Icon,
  Image01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useEffect, useMemo, useState, type CSSProperties } from "react"

import { getEventCtaLabel, type EventCtaType } from "@/lib/admin/events"
import { CountryFlag, getCountryOption } from "@/lib/countries"
import { cn } from "@/lib/utils"

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

const detailDateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})

const detailTimeFormatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
})

const rtlTextPattern = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

type EventDateStatus = "ended" | "today" | "upcoming"

function hasRtlText(value: string | null | undefined) {
  return Boolean(value && rtlTextPattern.test(value))
}

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameLocalDay(firstDate: Date, secondDate: Date) {
  return getLocalDayStart(firstDate).getTime() === getLocalDayStart(secondDate).getTime()
}

function isLocalDayBetween(date: Date, startsAt: Date, endsAt: Date) {
  const dayStart = getLocalDayStart(date).getTime()

  return (
    dayStart >= getLocalDayStart(startsAt).getTime() &&
    dayStart <= getLocalDayStart(endsAt).getTime()
  )
}

function getEventDateStatus(event: EventFeedItem, now = new Date()): EventDateStatus {
  const startsAt = new Date(event.starts_at)
  const endsAt = event.ends_at ? new Date(event.ends_at) : null
  const eventEnd = endsAt ?? startsAt

  if (now > eventEnd) {
    return "ended"
  }

  if (endsAt ? isLocalDayBetween(now, startsAt, endsAt) : isSameLocalDay(now, startsAt)) {
    return "today"
  }

  return "upcoming"
}

function formatEventDateTime(value: string) {
  const date = new Date(value)

  return {
    date: detailDateFormatter.format(date),
    time: detailTimeFormatter.format(date),
  }
}

function getCta(event: EventFeedItem) {
  if (event.cta_type === "external_link" && event.cta_url) {
    return {
      href: event.cta_url,
      label: getEventCtaLabel(event.cta_type),
    }
  }

  if (event.cta_type === "whatsapp" && event.cta_phone) {
    const phone = event.cta_phone.replace(/[^\d]/g, "")

    return {
      href: `https://wa.me/${phone}`,
      label: getEventCtaLabel(event.cta_type),
    }
  }

  if (event.cta_type === "phone" && event.cta_phone) {
    return {
      href: `tel:${event.cta_phone}`,
      label: getEventCtaLabel(event.cta_type),
    }
  }

  return null
}

type EventImageItem = {
  alt: string
  src: string
  title: string
}

function EventImage({
  alt,
  src,
  className,
  dynamicAspect = false,
  imageClassName,
  onOpen,
  sizes,
  title,
}: {
  alt: string
  src: string | null
  className?: string
  dynamicAspect?: boolean
  imageClassName?: string
  onOpen?: () => void
  sizes: string
  title: string
}) {
  const [imageAspect, setImageAspect] = useState<{
    ratio: number
    src: string
  } | null>(null)
  const aspectRatio = imageAspect?.src === src ? imageAspect.ratio : null
  const imageStyle: CSSProperties | undefined =
    dynamicAspect && aspectRatio ? { aspectRatio: String(aspectRatio) } : undefined

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
      style={imageStyle}
      aria-label={`Open ${title}`}
    >
      {dynamicAspect ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className="scale-105 object-cover opacity-35 blur-xl transition duration-200 group-hover:scale-110 dark:opacity-30"
          aria-hidden="true"
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cn(
          "transition duration-200 group-hover:scale-[1.02]",
          imageClassName ?? "object-cover"
        )}
        onLoad={(event) => {
          if (!dynamicAspect) {
            return
          }

          const image = event.currentTarget

          if (image.naturalWidth > 0 && image.naturalHeight > 0) {
            setImageAspect({
              ratio: image.naturalWidth / image.naturalHeight,
              src,
            })
          }
        }}
      />
    </button>
  )
}

function DetailIcon({
  icon,
}: {
  icon: typeof Calendar01Icon
}) {
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
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" />
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
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {config.label}
    </span>
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        onSelect((activeIndex - 1 + images.length) % images.length)
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        onSelect((activeIndex + 1) % images.length)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [activeIndex, hasMultipleImages, images.length, onClose, onSelect])

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
      <div className="grid max-h-full w-full max-w-6xl gap-3">
        <div className="flex items-center justify-between gap-3 text-white">
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
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
          </button>
        </div>

        <div className="relative h-[72vh] min-h-80 overflow-hidden rounded-lg bg-black">
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
                onClick={() =>
                  onSelect((activeIndex - 1 + images.length) % images.length)
                }
                className="absolute top-1/2 left-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 text-white transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
                aria-label="Show previous image"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => onSelect((activeIndex + 1) % images.length)}
                className="absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 text-white transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
                aria-label="Show next image"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function EventCard({ event }: { event: EventFeedItem }) {
  const cta = getCta(event)
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
          className="aspect-4/3 min-h-72 max-h-136 md:min-h-80 lg:min-h-96 lg:max-h-152"
          dynamicAspect
          imageClassName="object-contain"
          onOpen={
            event.cover_image_url ? () => setActiveImageIndex(0) : undefined
          }
        />

        {galleryImages.length > 0 ? (
          <div className="flex max-w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1">
            {galleryImages.map((image, index) => (
              <EventImage
                key={image}
                alt={`${event.title} gallery image ${index + 1}`}
                src={image}
                title={`${event.title} gallery image ${index + 1}`}
                sizes="7rem"
                className="aspect-square size-24 min-h-0 shrink-0 snap-start rounded-md sm:size-28"
                imageClassName="object-cover"
                onOpen={() =>
                  setActiveImageIndex(event.cover_image_url ? index + 1 : index)
                }
              />
            ))}
          </div>
        ) : null}
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
          </div>

          <div
            dir={hasRtlContent ? "rtl" : "ltr"}
            className={cn("min-w-0", hasRtlContent && "text-right")}
          >
            <h2 className="text-2xl leading-tight font-semibold tracking-normal text-foreground">
              {event.title}
            </h2>
            {event.description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 whitespace-pre-line text-muted-foreground">
                {event.description}
              </p>
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
                <HugeiconsIcon icon={Image01Icon} strokeWidth={2} className="size-4" />
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
