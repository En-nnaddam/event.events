import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  Clock01Icon,
  Image01Icon,
  Location01Icon,
  Wallet01Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { EventImageCarousel } from "@/components/events/event-image-carousel"
import { getPublishedEventBySlug } from "@/lib/admin/event-queries"
import { CountryFlag, getCountryOption } from "@/lib/countries"
import {
  formatEventDateTime,
  getEventCta,
  getEventDateStatus,
  hasRtlText,
  type EventDateStatus,
} from "@/lib/events/presentation"
import type { EventFeedItem } from "@/lib/events/types"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type EventPageProps = {
  params: Promise<{
    slug: string
  }>
}

async function getEvent(slug: string) {
  const supabase = await createClient()

  return getPublishedEventBySlug(supabase, slug)
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
      className: "border-primary/20 bg-primary/10 text-primary",
      label: "Upcoming",
    },
  }
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
        config.className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </span>
  )
}

function DetailRow({
  children,
  icon,
  label,
}: {
  children: React.ReactNode
  icon: typeof Calendar01Icon
  label: string
}) {
  return (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 rounded-md bg-surface-raised/70 p-4 ring-1 ring-border/60">
      <span className="inline-flex size-11 items-center justify-center rounded-md bg-background text-primary shadow-sm ring-1 ring-border/70 dark:text-accent-warm">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-normal text-muted-foreground uppercase">
          {label}
        </p>
        <div className="mt-1 text-sm leading-6 wrap-anywhere text-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}

function DateValue({ label, value }: { label: string; value: string }) {
  const dateTime = formatEventDateTime(value)

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{dateTime.date}</p>
      <p className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground">
        <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
        {dateTime.time}
      </p>
    </div>
  )
}

function getPriceLabel(event: EventFeedItem) {
  return event.price_type === "paid"
    ? event.price_text?.trim() || "Paid"
    : "Free"
}

function getGalleryImages(event: EventFeedItem) {
  const images = [
    event.cover_image_url,
    ...event.images.filter((image) => image !== event.cover_image_url),
  ].filter(Boolean)

  return Array.from(new Set(images)) as string[]
}

function EventMedia({ event }: { event: EventFeedItem }) {
  const images = getGalleryImages(event)

  if (images.length > 1) {
    return (
      <EventImageCarousel
        images={images.map((image, index) => ({
          alt:
            index === 0
              ? `${event.title} cover image`
              : `${event.title} gallery image ${index}`,
          src: image,
        }))}
      />
    )
  }

  const coverImageUrl = images[0]

  if (!coverImageUrl) {
    return (
      <div className="relative flex aspect-[4/3] max-h-[34rem] w-full min-w-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border/80 bg-surface-raised text-muted-foreground sm:aspect-[16/9]">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_45%)]"
          aria-hidden="true"
        />
        <span className="relative inline-flex items-center gap-2 rounded-full bg-background/85 px-4 py-2 text-sm font-semibold ring-1 ring-border/70 backdrop-blur">
          <HugeiconsIcon
            icon={Image01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Event image coming soon
        </span>
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/3] max-h-[34rem] w-full min-w-0 overflow-hidden rounded-lg bg-surface-raised ring-1 ring-border/70 sm:aspect-[16/9]">
      <Image
        src={coverImageUrl}
        alt=""
        fill
        sizes="100vw"
        className="scale-105 object-cover opacity-30 blur-2xl"
        priority
        aria-hidden="true"
      />
      <Image
        src={coverImageUrl}
        alt={`${event.title} cover image`}
        fill
        sizes="(max-width: 1024px) calc(100vw - 2rem), 72rem"
        className="object-contain"
        priority
      />
    </div>
  )
}

function EventAside({ event }: { event: EventFeedItem }) {
  const cta = getEventCta(event)
  const country = getCountryOption(event.country_code)
  const eventLocation = country ? `${event.city}, ${country.name}` : event.city

  return (
    <aside className="grid gap-4 lg:sticky lg:top-6 lg:self-start">
      {cta ? (
        <a
          href={cta.href}
          target={
            event.cta_type === "external_link" || event.cta_type === "whatsapp"
              ? "_blank"
              : undefined
          }
          rel={
            event.cta_type === "external_link" || event.cta_type === "whatsapp"
              ? "noreferrer"
              : undefined
          }
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {cta.label}
        </a>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-border/70 bg-card/90 p-4 shadow-xl shadow-black/5">
        <DetailRow icon={Calendar01Icon} label="Date and time">
          <div className="grid gap-4">
            <DateValue label="Starts" value={event.starts_at} />
            {event.ends_at ? (
              <DateValue label="Ends" value={event.ends_at} />
            ) : null}
          </div>
        </DetailRow>

        <DetailRow icon={Location01Icon} label="Location">
          <div className="grid gap-1">
            {event.location ? (
              <span className="font-medium">{event.location}</span>
            ) : null}
            <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5 text-muted-foreground">
              <CountryFlag
                code={event.country_code}
                className="h-4 w-6 shrink-0 rounded-[2px] shadow-sm ring-1 ring-border/70"
              />
              {eventLocation}
            </span>
            {event.is_online ? (
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary dark:border-accent-warm/35 dark:bg-accent-warm/15 dark:text-accent-warm">
                <HugeiconsIcon
                  icon={Wifi01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
                Online option
              </span>
            ) : null}
          </div>
        </DetailRow>

        <DetailRow icon={Wallet01Icon} label="Price">
          <span className="text-base font-semibold">
            {getPriceLabel(event)}
          </span>
        </DetailRow>
      </div>
    </aside>
  )
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    return {
      title: "Event not found",
    }
  }

  return {
    title: event.title,
    description:
      event.description?.trim().slice(0, 160) ??
      `Event in ${event.city}. View details, date, location, and booking options.`,
    openGraph: {
      images: event.cover_image_url ? [event.cover_image_url] : undefined,
      title: event.title,
      description: event.description ?? undefined,
      type: "article",
    },
  }
}

export default async function EventSlugPage({ params }: EventPageProps) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  const country = getCountryOption(event.country_code)
  const dateStatus = getEventDateStatus(event)
  const hasRtlContent = hasRtlText(event.title) || hasRtlText(event.description)

  return (
    <main className="min-h-svh overflow-x-clip bg-background">
      <section className="relative mx-auto max-w-[92rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_36%),linear-gradient(180deg,color-mix(in_oklch,var(--accent)_55%,transparent),transparent_74%)]"
          aria-hidden="true"
        />

        <div className="mb-5">
          <Link
            href="/discover#events"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/70 bg-card/80 px-3 py-2 text-sm font-semibold text-foreground shadow-sm shadow-black/5 transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-4"
            />
            Back to events
          </Link>
        </div>

        <div className="grid gap-7">
          <div
            dir={hasRtlContent ? "rtl" : "ltr"}
            className={cn(
              "grid min-w-0 gap-5 rounded-lg border border-border/70 bg-card/80 p-4 shadow-xl shadow-black/5 backdrop-blur sm:p-6",
              hasRtlContent && "text-right"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              {event.categories?.name ? (
                <span className="inline-flex min-h-8 items-center rounded-full border border-accent-warm/25 bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground shadow-sm">
                  {event.categories.name}
                </span>
              ) : null}
              <EventStatusChip status={dateStatus} />
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/60 bg-secondary/80 px-3 py-1 text-sm font-semibold text-secondary-foreground">
                <CountryFlag
                  code={event.country_code}
                  className="h-4 w-6 rounded-[2px] shadow-sm ring-1 ring-border/70"
                />
                {country ? `${event.city}, ${country.name}` : event.city}
              </span>
            </div>

            <div className="grid max-w-5xl min-w-0 gap-4">
              <h1 className="text-3xl leading-[1.12] font-semibold tracking-normal text-balance wrap-anywhere sm:text-4xl lg:text-5xl">
                {event.title}
              </h1>
              {event.description ? (
                <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {event.description.trim().split(/\r\n|\r|\n/)[0]}
                </p>
              ) : null}
            </div>
          </div>

          <EventMedia event={event} />

          <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            <div className="grid min-w-0 gap-8">
              <section
                dir={hasRtlContent ? "rtl" : "ltr"}
                className={cn(
                  "rounded-lg border border-border/70 bg-card/90 p-5 shadow-xl shadow-black/5 sm:p-6",
                  hasRtlContent && "text-right"
                )}
              >
                <p className="text-sm font-semibold text-primary dark:text-accent-warm">
                  About this event
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                  Details
                </h2>
                {event.description ? (
                  <p className="mt-4 max-w-4xl text-base leading-8 wrap-anywhere whitespace-pre-line text-muted-foreground">
                    {event.description.trim()}
                  </p>
                ) : (
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    More details will be added soon.
                  </p>
                )}
              </section>
            </div>

            <EventAside event={event} />
          </div>
        </div>
      </section>
    </main>
  )
}
