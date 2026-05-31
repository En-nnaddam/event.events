import Link from "next/link"
import {
  AiChipIcon,
  Airplane01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Briefcase01Icon,
  Building05Icon,
  FootballIcon,
  KitchenUtensilsIcon,
  Mic02Icon,
  MusicNote02Icon,
  PaintBoardIcon,
  Restaurant01Icon,
  TheaterIcon,
  TicketStarIcon,
  WorkoutSportIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { CategoryWithEventCount } from "@/lib/admin/categories"

type PopularCategoriesSectionProps = {
  categories: CategoryWithEventCount[]
}

type CategoryIcon = typeof MusicNote02Icon

const categoryIconMap: Array<{
  icon: CategoryIcon
  keywords: string[]
}> = [
  { icon: MusicNote02Icon, keywords: ["music", "concert", "song"] },
  { icon: FootballIcon, keywords: ["sport", "sports", "football"] },
  { icon: PaintBoardIcon, keywords: ["art", "arts", "design"] },
  { icon: Briefcase01Icon, keywords: ["business", "network"] },
  { icon: Restaurant01Icon, keywords: ["food", "restaurant"] },
  { icon: KitchenUtensilsIcon, keywords: ["cooking", "culinary"] },
  { icon: Building05Icon, keywords: ["culture", "community"] },
  { icon: AiChipIcon, keywords: ["technology", "tech", "digital"] },
  { icon: Airplane01Icon, keywords: ["travel", "tour"] },
  { icon: TheaterIcon, keywords: ["theatre", "theater", "théâtre"] },
  { icon: BookOpen01Icon, keywords: ["workshop", "learning", "education"] },
  { icon: Mic02Icon, keywords: ["talk", "conference", "summit"] },
  { icon: WorkoutSportIcon, keywords: ["fitness", "wellness"] },
]

function getCategoryIcon(category: CategoryWithEventCount) {
  const value = `${category.name} ${category.slug}`.toLowerCase()

  return (
    categoryIconMap.find(({ keywords }) =>
      keywords.some((keyword) => value.includes(keyword))
    )?.icon ?? TicketStarIcon
  )
}

function getEventCountLabel(eventCount: number) {
  return `${eventCount} ${eventCount === 1 ? "event" : "events"}`
}

export function PopularCategoriesSection({
  categories,
}: PopularCategoriesSectionProps) {
  if (!categories.length) {
    return null
  }

  const sortedCategories = [...categories].sort(
    (firstCategory, secondCategory) =>
      secondCategory.eventCount - firstCategory.eventCount ||
      firstCategory.name.localeCompare(secondCategory.name)
  )
  const visibleCategories = sortedCategories.slice(0, 8)
  const tickerCategories = sortedCategories.slice(0, 12)
  const tickerRepeatCount = Math.max(
    4,
    Math.ceil(24 / tickerCategories.length)
  )
  const tickerSegmentCategories = Array.from(
    { length: tickerRepeatCount },
    () => tickerCategories
  ).flat()

  return (
    <section className="border-t border-white/10 bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_34%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_92%,black),var(--background))] px-5 py-14 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] md:items-end">
          <div>
            <p className="text-sm font-medium text-primary dark:text-accent-warm">
              Browse by interest
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Popular categories
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground md:justify-self-end md:text-right">
            Jump into the categories people are publishing now, then refine by
            city, country, date, price, or format on Discover.
          </p>
        </div>

        <div className="popular-category-marquee mt-7 overflow-hidden rounded-lg border border-border/70 bg-card/55 p-2 shadow-lg shadow-black/10">
          <div
            className="popular-category-ticker flex w-max gap-2"
            aria-hidden="true"
          >
            {[0, 1].map((setIndex) => (
              <div
                key={setIndex}
                className="popular-category-ticker-segment flex shrink-0 gap-2"
              >
                {tickerSegmentCategories.map((category, categoryIndex) => (
                  <span
                    key={`${category.id}-${setIndex}-${categoryIndex}`}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border/70 bg-background/75 px-3 text-sm font-medium text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    {category.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCategories.map((category) => {
            const Icon = getCategoryIcon(category)

            return (
              <Link
                key={category.id}
                href={`/discover?category=${encodeURIComponent(category.slug)}#events`}
                className="group grid min-h-44 min-w-0 content-between overflow-hidden rounded-lg border border-border/80 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-2xl hover:shadow-primary/15 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary dark:border-accent-warm/25 dark:bg-accent-warm/10 dark:text-accent-warm">
                    <HugeiconsIcon
                      icon={Icon}
                      strokeWidth={2}
                      className="size-5"
                    />
                  </span>
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition group-hover:border-primary/35 group-hover:text-primary dark:group-hover:text-accent-warm">
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="size-4 transition group-hover:translate-x-0.5"
                    />
                  </span>
                </div>

                <div className="mt-8 min-w-0">
                  <h3 className="truncate text-xl font-semibold tracking-normal">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getEventCountLabel(category.eventCount)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
