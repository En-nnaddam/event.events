"use client"

import { useMemo, useState } from "react"
import { ArrowDown01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Combobox } from "@base-ui/react/combobox"

import {
  CountryFlag,
  countryOptions,
  getCountryOption,
  type CountryOption,
} from "@/lib/countries"
import { cn } from "@/lib/utils"

const inputClassName =
  "min-h-10 w-full rounded-md border border-border bg-background py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"

function countryMatches(country: CountryOption, query: string) {
  return country.searchValue.includes(query.trim().toLowerCase())
}

export function CountryCombobox({
  defaultValue,
  name = "country_code",
}: {
  defaultValue?: string | null
  name?: string
}) {
  const initialCountry = useMemo(
    () => getCountryOption(defaultValue),
    [defaultValue]
  )
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    initialCountry
  )
  const [inputValue, setInputValue] = useState(initialCountry?.name ?? "")

  function handleInputValueChange(value: string) {
    setInputValue(value)

    if (!value.trim() || (selectedCountry && value !== selectedCountry.name)) {
      setSelectedCountry(null)
    }
  }

  return (
    <Combobox.Root<CountryOption>
      autoHighlight
      filter={countryMatches}
      inputValue={inputValue}
      isItemEqualToValue={(itemValue, value) => itemValue.code === value.code}
      itemToStringLabel={(country) => country.name}
      itemToStringValue={(country) => country.code}
      items={countryOptions}
      onInputValueChange={handleInputValueChange}
      onValueChange={(country) => {
        setSelectedCountry(country)
        setInputValue(country?.name ?? "")
      }}
      value={selectedCountry}
    >
      <input name={name} type="hidden" value={selectedCountry?.code ?? ""} />

      <div className="relative">
        {selectedCountry ? (
          <CountryFlag
            code={selectedCountry.code}
            className="absolute top-1/2 left-3 h-4 w-6 -translate-y-1/2 rounded-[2px] object-cover shadow-sm ring-1 ring-border/70"
          />
        ) : null}

        <Combobox.Input
          aria-label="Country"
          autoComplete="off"
          className={cn(
            inputClassName,
            selectedCountry ? "px-20 pl-11" : "px-20 pl-3"
          )}
          placeholder="Select country"
        />

        <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1">
          {selectedCountry || inputValue ? (
            <Combobox.Clear
              aria-label="Clear country"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
              onClick={() => {
                setSelectedCountry(null)
                setInputValue("")
              }}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-4"
              />
            </Combobox.Clear>
          ) : null}

          <Combobox.Trigger
            aria-label="Open country list"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </Combobox.Trigger>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner
          align="start"
          sideOffset={6}
          className="z-50 w-(--anchor-width)"
        >
          <Combobox.Popup className="max-h-72 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl outline-none">
            <Combobox.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              No countries found.
            </Combobox.Empty>
            <Combobox.List className="max-h-70 overflow-y-auto">
              {(country: CountryOption) => (
                <Combobox.Item
                  key={country.code}
                  value={country}
                  className="flex min-h-10 cursor-default items-center gap-3 rounded-md px-3 py-2 text-sm transition outline-none data-[highlighted]:bg-muted data-[selected]:bg-primary/10"
                >
                  <CountryFlag
                    code={country.code}
                    className="h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-border/70"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {country.name}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {country.code}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
