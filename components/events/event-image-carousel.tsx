"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

type EventCarouselImage = {
  alt: string
  src: string
}

export function EventImageCarousel({
  images,
}: {
  images: EventCarouselImage[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]
  const hasMultipleImages = images.length > 1

  if (!activeImage) {
    return null
  }

  function showPrevious() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? images.length - 1 : currentIndex - 1
    )
  }

  function showNext() {
    setActiveIndex((currentIndex) =>
      currentIndex === images.length - 1 ? 0 : currentIndex + 1
    )
  }

  return (
    <div className="grid w-full max-w-full min-w-0 gap-3 overflow-hidden">
      <div className="relative aspect-[4/3] max-h-[34rem] w-full min-w-0 overflow-hidden rounded-lg bg-surface-raised ring-1 ring-border/70 sm:aspect-[16/10]">
        <Image
          src={activeImage.src}
          alt=""
          fill
          sizes="(max-width: 1024px) calc(100vw - 2rem), 72rem"
          className="scale-105 object-cover opacity-25 blur-2xl"
          aria-hidden="true"
        />
        <Image
          src={activeImage.src}
          alt={activeImage.alt}
          fill
          sizes="(max-width: 1024px) calc(100vw - 2rem), 72rem"
          className="object-contain"
        />

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute top-1/2 left-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 text-white shadow-lg transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none sm:left-3 sm:size-10"
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
              onClick={showNext}
              className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 text-white shadow-lg transition hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none sm:right-3 sm:size-10"
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

        <div className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur sm:right-3 sm:bottom-3 sm:px-3">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {hasMultipleImages ? (
        <div className="popular-category-scroll flex w-full max-w-full min-w-0 gap-2 overflow-x-auto py-1">
          {images.map((image, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-raised ring-2 transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-20 sm:w-28",
                  isActive
                    ? "ring-primary"
                    : "ring-border/70 hover:ring-primary/45"
                )}
                aria-label={`Show image ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="7rem"
                  className={cn(
                    "object-cover transition",
                    !isActive && "opacity-75"
                  )}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
