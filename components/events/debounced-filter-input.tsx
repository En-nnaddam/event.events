"use client"

import { useEffect, useRef, useState, useTransition } from "react"

import { useDebouncedCallback } from "@/hooks/use-debounced-callback"

type DebouncedFilterInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> & {
  debounceMs?: number
  onValueChange: (value: string) => void
  value: string
}

export function DebouncedFilterInput({
  debounceMs = 320,
  onValueChange,
  value,
  ...props
}: DebouncedFilterInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isPending, startTransition] = useTransition()
  const latestValueRef = useRef(value)

  const { callback: scheduleValueChange, cancel } = useDebouncedCallback(
    (nextValue: string) => {
      const cleanValue = nextValue.trim().replace(/\s+/g, " ")

      if (latestValueRef.current === cleanValue) {
        return
      }

      latestValueRef.current = cleanValue
      startTransition(() => onValueChange(cleanValue))
    },
    debounceMs
  )

  useEffect(() => {
    latestValueRef.current = value
    cancel()
  }, [cancel, value])

  function commitValue(nextValue: string) {
    cancel()
    const cleanValue = nextValue.trim().replace(/\s+/g, " ")

    if (latestValueRef.current === cleanValue) {
      return
    }

    latestValueRef.current = cleanValue
    startTransition(() => onValueChange(cleanValue))
  }

  return (
    <>
      <input
        {...props}
        onBlur={() => commitValue(inputValue)}
        onChange={(event) => {
          const nextValue = event.target.value
          setInputValue(nextValue)
          scheduleValueChange(nextValue)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commitValue(inputValue)
          }

          props.onKeyDown?.(event)
        }}
        value={inputValue}
      />
      {isPending ? (
        <span className="sr-only" aria-live="polite">
          Updating filters
        </span>
      ) : null}
    </>
  )
}
