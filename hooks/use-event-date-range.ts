import { useCallback, useState } from "react"

import { formatDateTimeLocal } from "@/lib/admin/events"

type EventDateRangeOptions = {
  endsAt: string | null
  startsAt: string | null
}

function addOneHour(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  date.setHours(date.getHours() + 1, 0, 0, 0)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")

  return `${year}-${month}-${day}T${hour}:00`
}

function isAfterDateTime(value: string, comparisonValue: string) {
  const date = new Date(value)
  const comparisonDate = new Date(comparisonValue)

  if (Number.isNaN(date.getTime()) || Number.isNaN(comparisonDate.getTime())) {
    return false
  }

  return date > comparisonDate
}

export function useEventDateRange(options: EventDateRangeOptions) {
  const [startsAt, setStartsAt] = useState(() =>
    formatDateTimeLocal(options.startsAt)
  )
  const [endsAt, setEndsAt] = useState(() =>
    formatDateTimeLocal(options.endsAt)
  )
  const [endsAtPickerKey, setEndsAtPickerKey] = useState(0)
  const hasInvalidEndDate = Boolean(
    startsAt && endsAt && !isAfterDateTime(endsAt, startsAt)
  )

  const handleStartsAtChange = useCallback(
    (nextStartsAt: string) => {
      setStartsAt(nextStartsAt)

      if (!nextStartsAt || (endsAt && isAfterDateTime(endsAt, nextStartsAt))) {
        return
      }

      setEndsAt(addOneHour(nextStartsAt))
      setEndsAtPickerKey((key) => key + 1)
    },
    [endsAt]
  )

  const handleEndsAtChange = useCallback((nextEndsAt: string) => {
    setEndsAt(nextEndsAt)
  }, [])

  return {
    endsAt,
    endsAtPickerKey,
    handleEndsAtChange,
    handleStartsAtChange,
    hasInvalidEndDate,
    startsAt,
  }
}
