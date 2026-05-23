"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"

type ExistingImage = {
  url: string
  label?: string
}

type ImageSelectorProps = {
  accept?: string
  description?: string
  existingImages?: ExistingImage[]
  existingInputName?: string
  label: string
  multiple?: boolean
  name?: string
  onExistingChange?: (urls: string[]) => void
  onFilesChange?: (files: File[]) => void
  singleExistingUrlName?: string
  singleKeepName?: string
}

type SelectedImage = {
  file: File
  id: string
  url: string
}

const defaultAccept = "image/png,image/jpeg,image/webp"

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function ImageThumb({
  label,
  meta,
  onRemove,
  removed,
  url,
}: {
  label: string
  meta?: string
  onRemove?: () => void
  removed?: boolean
  url: string
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-background ${removed ? "border-destructive/40 opacity-55" : "border-border"}`}
    >
      <div
        aria-label={label}
        role="img"
        className="aspect-video bg-muted bg-cover bg-center"
        style={{ backgroundImage: `url("${url}")` }}
      />
      <div className="flex min-w-0 items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{label}</p>
          {meta ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {meta}
            </p>
          ) : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {removed ? "Restore" : "Remove"}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function ImageSelector({
  accept = defaultAccept,
  description,
  existingImages = [],
  existingInputName,
  label,
  multiple = false,
  name,
  onExistingChange,
  onFilesChange,
  singleExistingUrlName,
  singleKeepName,
}: ImageSelectorProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedImagesRef = useRef<SelectedImage[]>([])
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [keptExisting, setKeptExisting] = useState(
    () => new Set(existingImages.map((image) => image.url))
  )

  const hasImages = existingImages.length > 0 || selectedImages.length > 0
  const keptExistingUrls = useMemo(
    () =>
      existingImages
        .filter((image) => keptExisting.has(image.url))
        .map((image) => image.url),
    [existingImages, keptExisting]
  )

  const selectedPreviews = useMemo(
    () =>
      selectedImages.map((image) => ({
        ...image,
        meta: `${image.file.type || "image"} - ${formatFileSize(image.file.size)}`,
      })),
    [selectedImages]
  )

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.url)
      )
    }
  }, [])

  useEffect(() => {
    onFilesChange?.(selectedImages.map((image) => image.file))
  }, [onFilesChange, selectedImages])

  useEffect(() => {
    onExistingChange?.(keptExistingUrls)
  }, [keptExistingUrls, onExistingChange])

  function syncInputFiles(files: File[]) {
    if (!inputRef.current) {
      return
    }

    const transfer = new DataTransfer()
    files.forEach((file) => transfer.items.add(file))
    inputRef.current.files = transfer.files
  }

  function updateSelectedImages(files: File[]) {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.url))

    const nextImages = files.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      url: URL.createObjectURL(file),
    }))

    setSelectedImages(nextImages)
    syncInputFiles(files)
  }

  function handleSelect(files: FileList | null) {
    const nextFiles = Array.from(files ?? [])
    updateSelectedImages(
      multiple
        ? [...selectedImages.map((image) => image.file), ...nextFiles]
        : nextFiles.slice(0, 1)
    )
  }

  function removeSelectedImage(id: string) {
    const removedImage = selectedImages.find((image) => image.id === id)
    const nextImages = selectedImages.filter((image) => image.id !== id)

    if (removedImage) {
      URL.revokeObjectURL(removedImage.url)
    }

    setSelectedImages(nextImages)
    syncInputFiles(nextImages.map((image) => image.file))
  }

  function toggleExisting(url: string) {
    const nextKept = new Set(keptExisting)

    if (nextKept.has(url)) {
      nextKept.delete(url)
    } else {
      nextKept.add(url)
    }

    setKeptExisting(nextKept)
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <label
          htmlFor={inputId}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition focus-within:ring-3 focus-within:ring-ring/40 hover:bg-primary/85"
        >
          {multiple
            ? "Add images"
            : selectedImages.length
              ? "Change image"
              : "Select image"}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => handleSelect(event.target.files)}
        />
      </div>

      {singleExistingUrlName && existingImages[0] ? (
        <input
          type="hidden"
          name={singleExistingUrlName}
          value={existingImages[0].url}
        />
      ) : null}

      {singleKeepName &&
      existingImages[0] &&
      keptExisting.has(existingImages[0].url) ? (
        <input type="hidden" name={singleKeepName} value="true" />
      ) : null}

      {existingInputName
        ? keptExistingUrls.map((url) => (
            <input
              key={url}
              type="hidden"
              name={existingInputName}
              value={url}
            />
          ))
        : null}

      {hasImages ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {existingImages.map((image, index) => (
            <ImageThumb
              key={image.url}
              label={image.label ?? `Current image ${index + 1}`}
              meta={
                keptExisting.has(image.url)
                  ? "Current image"
                  : "Will be removed"
              }
              removed={!keptExisting.has(image.url)}
              url={image.url}
              onRemove={() => toggleExisting(image.url)}
            />
          ))}

          {selectedPreviews.map((image) => (
            <ImageThumb
              key={image.id}
              label={image.file.name}
              meta={image.meta}
              url={image.url}
              onRemove={() => removeSelectedImage(image.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/35 p-6 text-center">
          <p className="text-sm font-medium">No image selected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            PNG, JPG, or WebP up to 5MB.
          </p>
        </div>
      )}
    </div>
  )
}
