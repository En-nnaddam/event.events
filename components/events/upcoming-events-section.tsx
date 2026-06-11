import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight01Icon,
  Calendar01Icon,
  Location01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { CountryFlag, getCountryOption } from "@/lib/countries"
import { formatEventDateTime, getEventCta } from "@/lib/events/presentation"
import type { EventFeedItem } from "@/lib/events/types"

type UpcomingEventsSectionProps = {
  events: EventFeedItem[]
}

function getPriceLabel(event: EventFeedItem) {
  return event.price_type === "paid"
    ? event.price_text?.trim() || "Paid"
    : "Free"
}

function EventMeta({
  children,
  icon,
}: {
  children: React.ReactNode
  icon: typeof Calendar01Icon
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
      <HugeiconsIcon
        icon={icon}
        strokeWidth={2}
        className="size-3.5 shrink-0"
      />
      <span className="truncate">{children}</span>
    </span>
  )
}

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  if (!events.length) {
    return null
  }

  return (
    <section className="border-t border-border/80 bg-background px-5 py-14 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary dark:text-accent-warm">
              Happening next
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Upcoming events
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-right">
            The next events worth checking out.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => {
            const country = getCountryOption(event.country_code)
            const dateTime = formatEventDateTime(event.starts_at)
            const cta = getEventCta(event)
            const eventLocation = country
              ? `${event.city}, ${country.name}`
              : event.city

            return (
              <article
                key={event.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-2xl hover:shadow-primary/15"
              >
                <div className="relative aspect-[4/3] min-h-44 overflow-hidden bg-surface-raised">
                  {event.cover_image_url ? (
                    <Image
                      src={event.cover_image_url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                      Event image
                    </div>
                  )}
                  {event.categories?.name ? (
                    <span className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-md border border-white/20 bg-black/55 px-2 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
                      {event.categories.name}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 min-h-14 text-lg leading-7 font-semibold tracking-normal">
                    {event.title}
                  </h3>

                  <div className="mt-3 grid gap-2 text-sm">
                    <EventMeta icon={Calendar01Icon}>
                      {dateTime.date} at {dateTime.time}
                    </EventMeta>
                    <EventMeta icon={Location01Icon}>
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <CountryFlag
                          code={event.country_code}
                          className="h-3.5 w-5 shrink-0 rounded-[2px] shadow-sm ring-1 ring-border/70"
                        />
                        <span className="truncate">
                          {event.is_online ? "Online" : eventLocation}
                        </span>
                      </span>
                    </EventMeta>
                    <EventMeta icon={Wallet01Icon}>
                      {getPriceLabel(event)}
                    </EventMeta>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 pt-1">
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
                        className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                      >
                        {cta.label}
                      </a>
                    ) : null}
                    <Link
                      href={`/event/${event.slug}`}
                      className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-border/80 bg-surface-raised px-3 py-2 text-center text-sm font-medium text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      <span>Details</span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        className="size-4 shrink-0"
                      />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
