"use client"

import { forwardRef, useImperativeHandle, useState } from "react"

import {
  getEventCtaLabel,
  type EventCtaType,
  type EventFormEvent,
} from "@/lib/admin/events"
import { cn } from "@/lib/utils"

export type EventCtaInputHandle = {
  validate: () => boolean
}

type EventCtaInputProps = {
  event?: Pick<EventFormEvent, "cta_type" | "cta_url" | "cta_phone">
}

const inputClassName =
  "min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
const invalidInputClassName =
  "border-destructive text-destructive focus:border-destructive focus:ring-destructive/20"
const validInputClassName =
  "border-success focus:border-success focus:ring-success/20"

function Field({
  children,
  label,
  required,
}: {
  children: React.ReactNode
  label: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const EventCtaInput = forwardRef<
  EventCtaInputHandle,
  EventCtaInputProps
>(function EventCtaInput({ event }, ref) {
  const [ctaType, setCtaType] = useState<EventCtaType>(
    event?.cta_type ?? "none"
  )
  const [ctaPhone, setCtaPhone] = useState(
    event?.cta_phone?.replace(/\D/g, "") ?? ""
  )
  const [ctaUrl, setCtaUrl] = useState(event?.cta_url ?? "")
  const [ctaUrlTouched, setCtaUrlTouched] = useState(false)

  const ctaLabel = getEventCtaLabel(ctaType)
  const trimmedCtaUrl = ctaUrl.trim()
  const hasCtaUrlValue = trimmedCtaUrl.length > 0
  const hasValidCtaUrl = hasCtaUrlValue && isHttpUrl(trimmedCtaUrl)
  const hasInvalidCtaUrl =
    ctaType === "external_link" &&
    ctaUrlTouched &&
    hasCtaUrlValue &&
    !hasValidCtaUrl
  const ctaUrlMessageId = "cta-url-validation-message"
  const ctaUrlClassName = cn(
    inputClassName,
    hasValidCtaUrl && validInputClassName,
    hasInvalidCtaUrl && invalidInputClassName
  )

  useImperativeHandle(ref, () => ({
    validate() {
      if (ctaType !== "external_link") {
        return true
      }

      setCtaUrlTouched(true)

      return !hasCtaUrlValue || hasValidCtaUrl
    },
  }))

  function handleCtaPhoneChange(
    changeEvent: React.ChangeEvent<HTMLInputElement>
  ) {
    setCtaPhone(changeEvent.target.value.replace(/\D/g, ""))
  }

  function handleCtaUrlChange(
    changeEvent: React.ChangeEvent<HTMLInputElement>
  ) {
    setCtaUrl(changeEvent.target.value)
    setCtaUrlTouched(true)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="CTA type">
        <select
          className={inputClassName}
          name="cta_type"
          value={ctaType}
          onChange={(event) => setCtaType(event.target.value as EventCtaType)}
        >
          <option value="none">None</option>
          <option value="external_link">External link</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">Phone</option>
        </select>
      </Field>

      {ctaType !== "none" ? (
        <>
          <Field label="CTA label">
            <input className={inputClassName} value={ctaLabel} readOnly />
          </Field>

          {ctaType === "external_link" ? (
            <>
              <Field label="CTA URL" required>
                <div className="grid gap-2">
                  <input
                    aria-describedby={
                      hasInvalidCtaUrl ? ctaUrlMessageId : undefined
                    }
                    aria-invalid={hasInvalidCtaUrl}
                    className={ctaUrlClassName}
                    name="cta_url"
                    type="url"
                    value={ctaUrl}
                    onBlur={() => setCtaUrlTouched(true)}
                    onChange={handleCtaUrlChange}
                    required
                  />
                  {hasInvalidCtaUrl ? (
                    <p
                      id={ctaUrlMessageId}
                      className="text-xs font-medium text-destructive"
                    >
                      Use a valid HTTP or HTTPS URL.
                    </p>
                  ) : null}
                </div>
              </Field>
              <input type="hidden" name="cta_phone" value="" />
            </>
          ) : (
            <>
              <Field label="CTA phone" required>
                <input
                  className={inputClassName}
                  name="cta_phone"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  value={ctaPhone}
                  onChange={handleCtaPhoneChange}
                  required
                />
              </Field>
              <input type="hidden" name="cta_url" value="" />
            </>
          )}
        </>
      ) : (
        <>
          <input type="hidden" name="cta_url" value="" />
          <input type="hidden" name="cta_phone" value="" />
        </>
      )}
    </div>
  )
})
