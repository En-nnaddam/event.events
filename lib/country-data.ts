import { getCountryDataList, type TCountryCode } from "countries-list"

export type CountryCode = TCountryCode

export type CountryOption = {
  code: CountryCode
  name: string
  searchValue: string
}

export const countryOptions = getCountryDataList()
  .map((country) => ({
    code: country.iso2,
    name: country.name,
    searchValue: `${country.name} ${country.iso2}`.toLowerCase(),
  }))
  .sort((firstCountry, secondCountry) =>
    firstCountry.name.localeCompare(secondCountry.name)
  )

const countryOptionByCode = new Map(
  countryOptions.map((country) => [country.code, country])
)

export function normalizeCountryCode(value: string) {
  return value.trim().toUpperCase()
}

export function isCountryCode(value: string): value is CountryCode {
  return countryOptionByCode.has(normalizeCountryCode(value) as CountryCode)
}

export function getCountryOption(code: string | null | undefined) {
  if (!code) {
    return null
  }

  return (
    countryOptionByCode.get(normalizeCountryCode(code) as CountryCode) ?? null
  )
}
