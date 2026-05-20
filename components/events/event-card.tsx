import { cn } from "@/lib/utils"

type EventCtaType = "external_link" | "whatsapp" | "phone" | "none"

export type EventFeedItem = {
  id: string
  title: string
  slug: string
  description: string | null
  city: string
  location: string | null
  starts_at: string
  ends_at: string | null
  cover_image_url: string | null
  images: string[]
  cta_type: EventCtaType
  cta_label: string | null
  cta_url: string | null
  cta_phone: string | null
  status: "published"
  categories: {
    name: string
    slug: string
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
      label: event.cta_label || "Open event link",
    }
  }

  if (event.cta_type === "whatsapp" && event.cta_phone) {
    const phone = event.cta_phone.replace(/[^\d]/g, "")

    return {
      href: `https://wa.me/${phone}`,
      label: event.cta_label || "Contact on WhatsApp",
    }
  }

  if (event.cta_type === "phone" && event.cta_phone) {
    return {
      href: `tel:${event.cta_phone}`,
      label: event.cta_label || event.cta_phone,
    }
  }

  return null
}

function EventImage({
  src,
  title,
  className,
}: {
  src: string | null
  title: string
  className?: string
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex min-h-56 items-center justify-center rounded-lg border border-border bg-muted text-sm font-medium text-muted-foreground",
          className
        )}
      >
        Event image
      </div>
    )
  }

  return (
    <div
      aria-label={title}
      role="img"
      className={cn("min-h-56 rounded-lg bg-cover bg-center", className)}
      style={{ backgroundImage: `url("${src}")` }}
    />
  )
}

export function EventCard({ event }: { event: EventFeedItem }) {
  const cta = getCta(event)
  const galleryImages = event.images.filter((image) => image && image !== event.cover_image_url)

  return (
    <article className="grid gap-5 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(220px,0.42fr)_1fr] md:p-5">
      <div className="grid gap-3">
        <EventImage src={event.cover_image_url} title={event.title} />

        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {galleryImages.slice(0, 3).map((image) => (
              <EventImage
                key={image}
                src={image}
                title={`${event.title} gallery image`}
                className="min-h-20 rounded-md"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {event.categories?.name ? (
            <span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">
              {event.categories.name}
            </span>
          ) : null}
          <span className="rounded-md bg-muted px-2 py-1">{event.city}</span>
          <span className="rounded-md bg-muted px-2 py-1">Published</span>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-foreground">{event.title}</h2>
          {event.description ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {event.description}
            </p>
          ) : null}
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-3">
            <dt className="font-medium text-foreground">Date</dt>
            <dd className="mt-1 leading-5 text-muted-foreground">{formatDateRange(event)}</dd>
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <dt className="font-medium text-foreground">Place</dt>
            <dd className="mt-1 leading-5 text-muted-foreground">
              {event.location ? `${event.location}, ${event.city}` : event.city}
            </dd>
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <dt className="font-medium text-foreground">Event slug</dt>
            <dd className="mt-1 break-words text-muted-foreground">{event.slug}</dd>
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <dt className="font-medium text-foreground">Contact</dt>
            <dd className="mt-1 break-words text-muted-foreground">
              {event.cta_phone || event.cta_url || "No contact added"}
            </dd>
          </div>
        </dl>

        {cta ? (
          <div>
            <a
              href={cta.href}
              target={event.cta_type === "external_link" || event.cta_type === "whatsapp" ? "_blank" : undefined}
              rel={event.cta_type === "external_link" || event.cta_type === "whatsapp" ? "noreferrer" : undefined}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {cta.label}
            </a>
          </div>
        ) : null}
      </div>
    </article>
  )
}
