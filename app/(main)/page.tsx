import Image from "next/image"

import { HomeDiscoveryForm } from "@/components/events/home-discovery-form"

export default function Page() {
  return (
    <main className="min-h-[calc(100svh-4rem)] bg-background">
      <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden border-b border-border/80">
        <Image
          src="/event-discovery-hero-themed.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.76)_0%,rgb(0_0_0/0.58)_43%,rgb(0_0_0/0.22)_72%,rgb(0_0_0/0.14)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(0deg,rgb(0_0_0/0.38)_0%,transparent_38%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl items-center px-5 py-14 sm:px-6 lg:px-8">
          <div className="max-w-4xl pt-4">
            <p className="inline-flex rounded-md border border-white/18 bg-white/10 px-3 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur">
              Events worth leaving the house for
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl leading-[1.04] font-semibold tracking-normal text-balance text-white sm:text-5xl sm:leading-[1.02] lg:text-6xl">
              Find what is happening next, wherever you are.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              Search events by interest, city, country, or date. Start broad,
              then refine the feed when you are ready.
            </p>

            <HomeDiscoveryForm />
          </div>
        </div>
      </section>
    </main>
  )
}
