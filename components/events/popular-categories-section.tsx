import Image from "next/image"
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

function getCategoryUrl(category: CategoryWithEventCount) {
  return `/discover?category=${encodeURIComponent(category.slug)}#events`
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
  const featuredCategories = sortedCategories.slice(0, 4)
  const supportingCategories = sortedCategories.slice(4, 12)
  const desktopCategories = sortedCategories.slice(0, 8)
  const totalEventCount = sortedCategories.reduce(
    (count, category) => count + category.eventCount,
    0
  )

  return (
    <section className="border-t border-white/10 bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_88%_18%,color-mix(in_oklch,var(--accent-warm)_16%,transparent),transparent_30%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_92%,black),var(--background))] px-5 py-10 text-foreground sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(21rem,0.64fr)] lg:items-end">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary dark:text-accent-warm">
              Browse by interest
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Popular categories
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Jump into the categories people are publishing now, then refine by
              city, country, date, price, or format on Discover.
            </p>
          </div>

          <div className="relative min-h-52 overflow-hidden rounded-lg border border-white/10 bg-card shadow-2xl shadow-black/25 sm:min-h-64 lg:min-h-72">
            <Image
              src="/popular-categories-collage.png"
              alt=""
              fill
              sizes="(max-width: 1024px) calc(100vw - 2.5rem), 36vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.05),rgb(0_0_0/0.66))]"
              aria-hidden="true"
            />
            <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/66">
                  Live interests
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-normal text-white">
                  {totalEventCount}
                </p>
                <p className="text-xs text-white/70">
                  {totalEventCount === 1 ? "event" : "events"} across{" "}
                  {sortedCategories.length} categories
                </p>
              </div>
              {featuredCategories[0] ? (
                <Link
                  href={getCategoryUrl(featuredCategories[0])}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-white/16 bg-black/44 px-3 py-2 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:bg-black/58 focus-visible:ring-3 focus-visible:ring-white/35 focus-visible:outline-none"
                >
                  {featuredCategories[0].name}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:hidden">
          {featuredCategories.map((category) => {
            const Icon = getCategoryIcon(category)

            return (
              <Link
                key={category.id}
                href={getCategoryUrl(category)}
                className="group flex min-h-24 min-w-0 items-center gap-3 rounded-lg border border-border/80 bg-card/92 p-3 shadow-sm transition hover:border-primary/45 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary dark:border-accent-warm/25 dark:bg-accent-warm/10 dark:text-accent-warm">
                  <HugeiconsIcon
                    icon={Icon}
                    strokeWidth={2}
                    className="size-5"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold tracking-normal">
                    {category.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {getEventCountLabel(category.eventCount)}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>

        {supportingCategories.length ? (
          <div className="popular-category-scroll mt-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {supportingCategories.map((category) => {
              const Icon = getCategoryIcon(category)

              return (
                <Link
                  key={category.id}
                  href={getCategoryUrl(category)}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border/80 bg-background/70 px-3 text-sm font-medium text-muted-foreground transition hover:border-primary/45 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <HugeiconsIcon
                    icon={Icon}
                    strokeWidth={2}
                    className="size-4 text-primary dark:text-accent-warm"
                  />
                  {category.name}
                </Link>
              )
            })}
          </div>
        ) : null}

        <div className="mt-7 hidden gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-4">
          {desktopCategories.map((category) => {
            const Icon = getCategoryIcon(category)

            return (
              <Link
                key={category.id}
                href={getCategoryUrl(category)}
                className="group grid min-h-36 min-w-0 content-between overflow-hidden rounded-lg border border-border/80 bg-card/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card hover:shadow-2xl hover:shadow-primary/15 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
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

                <div className="mt-5 min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-normal">
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
