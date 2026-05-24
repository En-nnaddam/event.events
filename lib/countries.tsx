import * as React from "react"
import * as FlagIcons from "country-flag-icons/react/3x2"
import { getCountryOption } from "@/lib/country-data"

export {
  countryOptions,
  getCountryOption,
  isCountryCode,
  normalizeCountryCode,
  type CountryCode,
  type CountryOption,
} from "@/lib/country-data"

type FlagComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

const flagIcons = FlagIcons as Record<string, FlagComponent | undefined>

export function CountryFlag({
  className,
  code,
}: {
  className?: string
  code: string | null | undefined
}) {
  const country = getCountryOption(code)

  if (!country) {
    return null
  }

  const Flag = flagIcons[country.code]

  if (!Flag) {
    return null
  }

  return <Flag aria-hidden="true" className={className} />
}
