"use client"

import { useState } from "react"
import type { RefObject } from "react"

import { DatePicker } from "@/components/admin/date-picker"
import {
  EventCtaInput,
  type EventCtaInputHandle,
} from "@/components/admin/event-cta-input"
import { ImageSelector } from "@/components/admin/image-selector"
import { Panel, PanelHeader } from "@/components/layout/page-shell"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { Field, fieldControlClassName } from "@/components/ui/form-field"
import type {
  CategoryOption,
  EventFormEvent,
  EventPriceType,
} from "@/lib/admin/events"

type ExistingImage = {
  label: string
  url: string
}

export function EventCoreDetailsSection({
  categories,
  event,
  onTitleChange,
  title,
}: {
  categories: CategoryOption[]
  event?: EventFormEvent
  onTitleChange: (value: string) => void
  title: string
}) {
  return (
    <Panel className="grid gap-4">
      <PanelHeader
        title="Core details"
        description="These fields control how the event appears publicly."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" required>
          <input
            className={fieldControlClassName}
            name="title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />
        </Field>

        <Field label="Category" required>
          <select
            className={fieldControlClassName}
            name="category_id"
            defaultValue={event?.category_id ?? ""}
            required
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={`${fieldControlClassName} min-h-32 resize-y`}
          name="description"
          defaultValue={event?.description ?? ""}
        />
      </Field>
    </Panel>
  )
}

export function EventDateLocationSection({
  endsAt,
  endsAtPickerKey,
  event,
  handleEndsAtChange,
  handleStartsAtChange,
  hasInvalidEndDate,
  minEventDate,
  startsAt,
}: {
  endsAt: string
  endsAtPickerKey: number
  event?: EventFormEvent
  handleEndsAtChange: (value: string) => void
  handleStartsAtChange: (value: string) => void
  hasInvalidEndDate: boolean
  minEventDate: Date
  startsAt: string
}) {
  return (
    <Panel className="grid gap-4">
      <PanelHeader
        title="When and where"
        description="Dates, city, and venue details shown on event cards."
      />

      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City" required>
            <input
              className={fieldControlClassName}
              name="city"
              defaultValue={event?.city ?? ""}
              required
            />
          </Field>

          <Field label="Country">
            <CountryCombobox
              defaultValue={event?.country_code}
              name="country_code"
            />
          </Field>
        </div>

        <Field label="Location">
          <input
            className={fieldControlClassName}
            name="location"
            defaultValue={event?.location ?? ""}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Starts at" required>
            <DatePicker
              allowPastValue={Boolean(event)}
              minDate={minEventDate}
              name="starts_at"
              value={startsAt}
              onChange={handleStartsAtChange}
              required
            />
          </Field>

          <Field label="Ends at">
            <DatePicker
              allowPastValue={Boolean(event)}
              key={endsAtPickerKey}
              error={
                hasInvalidEndDate
                  ? "End date must be after the start date."
                  : undefined
              }
              minDate={minEventDate}
              name="ends_at"
              value={endsAt}
              onChange={handleEndsAtChange}
            />
          </Field>
        </div>
      </div>
    </Panel>
  )
}

export function EventPriceFormatSection({ event }: { event?: EventFormEvent }) {
  const [priceType, setPriceType] = useState<EventPriceType>(
    event?.price_type ?? "free"
  )

  return (
    <Panel className="grid gap-4">
      <PanelHeader
        title="Price and format"
        description="Show whether the event is free, paid, or available online."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Price">
          <select
            className={fieldControlClassName}
            name="price_type"
            value={priceType}
            onChange={(event) =>
              setPriceType(event.target.value as EventPriceType)
            }
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </Field>

        {priceType === "paid" ? (
          <Field label="Price text">
            <input
              className={fieldControlClassName}
              name="price_text"
              defaultValue={event?.price_text ?? ""}
              placeholder="150 MAD"
            />
          </Field>
        ) : null}
      </div>

      <label className="flex items-start gap-3 rounded-md border border-border/70 bg-surface-raised p-3 text-sm font-medium">
        <input
          type="checkbox"
          name="is_online"
          defaultChecked={event?.is_online ?? false}
          className="mt-1 size-4 rounded border-border accent-primary"
        />
        <span className="grid gap-1">
          <span>Online event</span>
          <span className="text-xs leading-5 font-normal text-muted-foreground">
            Show an online badge while keeping the existing city and location
            details.
          </span>
        </span>
      </label>
    </Panel>
  )
}

export function EventImagesSection({
  existingCoverImages,
  existingGalleryImages,
  onCoverFilesChange,
  onGalleryFilesChange,
  onKeptCoverChange,
  onKeptGalleryChange,
}: {
  existingCoverImages: ExistingImage[]
  existingGalleryImages: ExistingImage[]
  onCoverFilesChange: (files: File[]) => void
  onGalleryFilesChange: (files: File[]) => void
  onKeptCoverChange: (urls: string[]) => void
  onKeptGalleryChange: (urls: string[]) => void
}) {
  return (
    <Panel className="grid gap-4">
      <PanelHeader
        title="Images"
        description="Images are optimized before uploading."
      />

      <ImageSelector
        label="Cover image"
        description="Use one strong image for the event card hero."
        existingImages={existingCoverImages}
        onExistingChange={onKeptCoverChange}
        onFilesChange={onCoverFilesChange}
      />

      <ImageSelector
        label="Gallery images"
        description="Add supporting images that appear under the cover."
        multiple
        existingImages={existingGalleryImages}
        onExistingChange={onKeptGalleryChange}
        onFilesChange={onGalleryFilesChange}
      />
    </Panel>
  )
}

export function EventCtaSection({
  ctaInputRef,
  event,
}: {
  ctaInputRef: RefObject<EventCtaInputHandle | null>
  event?: EventFormEvent
}) {
  return (
    <Panel className="grid gap-4">
      <PanelHeader
        title="Call to action"
        description="Choose how visitors can contact or book."
      />

      <EventCtaInput ref={ctaInputRef} event={event} />
    </Panel>
  )
}

export function EventProgressPanel({
  detail,
  label,
  optimizationSummary,
  processing,
}: {
  detail: string
  label: string
  optimizationSummary: string | null
  processing: boolean
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {processing ? (
          <p className="text-xs text-muted-foreground">
            Please keep this page open.
          </p>
        ) : null}
      </div>
      {detail ? (
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      ) : null}
      {optimizationSummary ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {optimizationSummary}
        </p>
      ) : null}
      {processing ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      ) : null}
    </Panel>
  )
}
