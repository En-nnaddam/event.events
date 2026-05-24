"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

import { getEventCtaLabel, type EventCtaType } from "@/lib/admin/events"
import { cn } from "@/lib/utils"

export type EventFeedItem = {
  id: string
  title: string
  description: string | null
  city: string
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

const dateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function formatEventDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatDateRange(event: EventFeedItem) {
  const startsAt = formatEventDate(event.starts_at)

  if (!event.ends_at) {
    return startsAt
  }

  return `${startsAt} - ${formatEventDate(event.ends_at)}`
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
          "flex min-h-56 items-center justify-center rounded-lg border border-border/80 bg-surface-raised text-sm font-medium text-muted-foreground",
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
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition duration-200 group-hover:scale-[1.03]"
      />
    </button>
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
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-white/10 px-3 text-sm font-medium transition hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
            aria-label="Close image preview"
          >
            X
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
                className="absolute top-1/2 left-3 inline-flex h-10 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 px-3 text-sm font-medium text-white transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
                aria-label="Show previous image"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => onSelect((activeIndex + 1) % images.length)}
                className="absolute top-1/2 right-3 inline-flex h-10 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 px-3 text-sm font-medium text-white transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
                aria-label="Show next image"
              >
                Next
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
  const galleryImages = event.images.filter(
    (image) => image && image !== event.cover_image_url
  )
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
    <article className="grid w-full min-w-0 gap-5 overflow-hidden rounded-lg border border-border/80 bg-card p-4 shadow-lg shadow-black/15 md:grid-cols-[minmax(220px,0.42fr)_1fr] md:p-5">
      <div className="grid min-w-0 gap-3">
        <EventImage
          alt={`${event.title} cover image`}
          src={event.cover_image_url}
          title={`${event.title} cover image`}
          sizes="(max-width: 768px) calc(100vw - 2rem), 38vw"
          className="aspect-video min-h-0 md:aspect-auto md:min-h-56"
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
                sizes="9rem"
                className="h-24 min-h-24 w-36 shrink-0 snap-start rounded-md"
                onOpen={() =>
                  setActiveImageIndex(event.cover_image_url ? index + 1 : index)
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-normal text-muted-foreground uppercase">
          {event.categories?.name ? (
            <span className="rounded-md border border-accent-warm/20 bg-accent px-2 py-1 text-accent-foreground">
              {event.categories.name}
            </span>
          ) : null}
          <span className="rounded-md border border-border/70 bg-secondary px-2 py-1 text-secondary-foreground">
            {event.city}
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-foreground">
            {event.title}
          </h2>
          {event.description ? (
            <p className="mt-3 text-sm leading-6 whitespace-pre-line text-muted-foreground">
              {event.description}
            </p>
          ) : null}
        </div>

        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-md border border-border/70 bg-surface-raised p-3">
            <dt className="font-medium text-foreground">Date</dt>
            <dd className="mt-1 leading-5 [overflow-wrap:anywhere] break-words text-muted-foreground">
              {formatDateRange(event)}
            </dd>
          </div>

          <div className="rounded-md border border-border/70 bg-surface-raised p-3">
            <dt className="font-medium text-foreground">Place</dt>
            <dd className="mt-1 leading-5 [overflow-wrap:anywhere] break-words text-muted-foreground">
              {event.location ? `${event.location}, ${event.city}` : event.city}
            </dd>
          </div>
        </dl>

        {cta ? (
          <div>
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
