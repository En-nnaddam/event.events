"use client"

import { useMemo, useState } from "react"
import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  allowPastValue?: boolean
  error?: string
  minDate?: Date
  name: string
  onChange: (value: string) => void
  required?: boolean
  value: string
}

type TimeParts = {
  hour: string
  minute: string
}

const hourOptions = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
)
const minuteOptions = ["00", "15", "30", "45"]
const defaultTimeValue = "08:00"

function getTriggerClassName(hasError: boolean) {
  return cn(
    buttonVariants({ variant: "outline" }),
    "h-10 w-full justify-start gap-2 rounded-md px-3 text-left font-normal",
    !hasError && "border-border",
    hasError &&
      "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
  )
}

function formatDateLabel(date: Date | undefined) {
  if (!date) {
    return "Select date"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatDateValue(date: Date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function splitDateTime(value: string) {
  const [datePart = "", timePart = ""] = value.split("T")
  const [year = "", month = "", day = ""] = datePart.split("-")
  const [hour = "", minute = ""] = timePart.split(":")
  const selectedDate =
    year && month && day
      ? new Date(Number(year), Number(month) - 1, Number(day))
      : undefined

  return {
    date: selectedDate,
    time: hour && minute ? `${hour}:${minute}` : defaultTimeValue,
  }
}

function parseTime(value: string): TimeParts | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/)

  if (!match) {
    return null
  }

  const [, hour, minute] = match
  return { hour, minute }
}

function buildDateTime(date: Date | undefined, timeValue: string) {
  const time = parseTime(timeValue)

  if (!date || !time) {
    return ""
  }

  return `${formatDateValue(date)}T${time.hour}:${time.minute}`
}

export function DatePicker({
  allowPastValue = false,
  error,
  minDate,
  name,
  onChange,
  required,
  value,
}: DatePickerProps) {
  const initialValue = useMemo(() => splitDateTime(value), [value])
  const [dateOpen, setDateOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialValue.date
  )
  const [timeValue, setTimeValue] = useState(initialValue.time)
  const hiddenValue = buildDateTime(selectedDate, timeValue)
  const timeError = Boolean(timeValue && !parseTime(timeValue))
  const hasError = Boolean(error || timeError)
  const errorId = error ? `${name}-error` : undefined
  const disabledDates = minDate ? { before: minDate } : undefined

  function syncValue(nextDate: Date | undefined, nextTimeValue: string) {
    const nextValue = buildDateTime(nextDate, nextTimeValue)

    if (nextValue || !nextDate) {
      onChange(nextValue)
    }
  }

  function updateDate(nextDate: Date | undefined) {
    if (
      nextDate &&
      minDate &&
      nextDate < minDate &&
      (!allowPastValue || nextDate.getTime() !== initialValue.date?.getTime())
    ) {
      return
    }

    setSelectedDate(nextDate)
    setDateOpen(false)
    syncValue(nextDate, timeValue)
  }

  function updateTime(nextTimeValue: string) {
    setTimeValue(nextTimeValue)
    syncValue(selectedDate, nextTimeValue)
  }

  function updateTimePart(part: keyof TimeParts, nextValue: string) {
    const time = parseTime(timeValue) ??
      parseTime(defaultTimeValue) ?? { hour: "08", minute: "00" }
    const nextTimeValue =
      part === "hour"
        ? `${nextValue}:${time.minute}`
        : `${time.hour}:${nextValue}`

    updateTime(nextTimeValue)
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={hiddenValue} />
      <input
        aria-hidden="true"
        className="sr-only"
        onChange={() => undefined}
        required={required}
        tabIndex={-1}
        value={selectedDate ? "selected" : ""}
      />

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            aria-describedby={errorId}
            aria-invalid={hasError}
            className={getTriggerClassName(hasError)}
            type="button"
          >
            <HugeiconsIcon
              icon={Calendar01Icon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            <span
              className={
                selectedDate ? "text-foreground" : "text-muted-foreground"
              }
            >
              {formatDateLabel(selectedDate)}
            </span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={updateDate}
              disabled={disabledDates}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>

        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger
            aria-describedby={errorId}
            aria-invalid={hasError}
            className={getTriggerClassName(hasError)}
            type="button"
          >
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            <span className="text-foreground">{timeValue}</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <p className="px-1 text-xs font-medium text-muted-foreground">
                  Hour
                </p>
                <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto pr-1">
                  {hourOptions.map((hour) => (
                    <Button
                      key={hour}
                      type="button"
                      variant={
                        timeValue.startsWith(`${hour}:`) ? "default" : "ghost"
                      }
                      size="sm"
                      className="rounded-md"
                      onClick={() => updateTimePart("hour", hour)}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <p className="px-1 text-xs font-medium text-muted-foreground">
                  Minute
                </p>
                <div className="grid gap-1">
                  {minuteOptions.map((minute) => (
                    <Button
                      key={minute}
                      type="button"
                      variant={
                        timeValue.endsWith(`:${minute}`) ? "default" : "ghost"
                      }
                      size="sm"
                      className="rounded-md"
                      onClick={() => updateTimePart("minute", minute)}
                    >
                      {minute}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
