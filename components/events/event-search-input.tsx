"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type EventSearchInputProps = {
  className?: string
  onQueryChange: (query: string) => void
  value: string
}

const DEBOUNCE_MS = 280

export function EventSearchInput({
  className,
  onQueryChange,
  value,
}: EventSearchInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isPending, startTransition] = useTransition()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestValueRef = useRef(value)

  function clearPendingCommit() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function commitQuery(query: string) {
    const cleanQuery = query.trim().replace(/\s+/g, " ")

    clearPendingCommit()

    if (latestValueRef.current === cleanQuery) {
      return
    }

    latestValueRef.current = cleanQuery
    startTransition(() => onQueryChange(cleanQuery))
  }

  function scheduleQuery(query: string) {
    clearPendingCommit()
    timeoutRef.current = setTimeout(() => commitQuery(query), DEBOUNCE_MS)
  }

  useEffect(() => clearPendingCommit, [])

  return (
    <span className="relative">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        className={className}
        onBlur={() => commitQuery(inputValue)}
        onChange={(event) => {
          const nextValue = event.target.value
          setInputValue(nextValue)
          scheduleQuery(nextValue)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commitQuery(inputValue)
          }
        }}
        placeholder="Search title, city, venue..."
        value={inputValue}
      />
      {isPending ? (
        <span className="sr-only" aria-live="polite">
          Updating search results
        </span>
      ) : null}
    </span>
  )
}
