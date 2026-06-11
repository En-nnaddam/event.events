"use client"

import {
  buildEventCoverImagePath,
  buildEventGalleryImagePath,
  EVENT_IMAGE_BUCKET,
} from "@/lib/admin/events"
import { formatImageSize, optimizeImage } from "@/lib/images/optimize"
import {
  uploadPublicFile,
  type UploadedPublicFile,
} from "@/lib/supabase/storage-client"

export type EventImageUploadResult = {
  error?: string
  uploadedCover: UploadedPublicFile | null
  uploadedGallery: UploadedPublicFile[]
  uploadedPaths: string[]
}

export type OptimizedEventImages = {
  files: File[]
  originalTotal: number
  optimizedTotal: number
}

function getImageExtension(file: File) {
  return file.type === "image/webp" ? "webp" : "jpg"
}

export function getOptimizationSummary({
  optimizedTotal,
  originalTotal,
  totalFiles,
}: {
  optimizedTotal: number
  originalTotal: number
  totalFiles: number
}) {
  if (totalFiles === 0) {
    return null
  }

  return `Optimized ${totalFiles} image${totalFiles === 1 ? "" : "s"} from ${formatImageSize(
    originalTotal
  )} to ${formatImageSize(optimizedTotal)}.`
}

export async function optimizeEventImages(
  files: File[],
  onProgress?: (file: File) => void
): Promise<OptimizedEventImages> {
  const optimizedFiles: File[] = []
  let originalTotal = 0
  let optimizedTotal = 0

  for (const file of files) {
    onProgress?.(file)
    const optimized = await optimizeImage(file)
    optimizedFiles.push(optimized.file)
    originalTotal += optimized.originalSize
    optimizedTotal += optimized.optimizedSize
  }

  return { files: optimizedFiles, originalTotal, optimizedTotal }
}

export async function uploadEventImages({
  cover,
  eventId,
  gallery,
  onProgress,
}: {
  cover: File[]
  eventId: string
  gallery: File[]
  onProgress?: (message: string) => void
}): Promise<EventImageUploadResult> {
  const uploadedPaths: string[] = []
  let uploadedCover: UploadedPublicFile | null = null
  const uploadedGallery: UploadedPublicFile[] = []

  if (cover[0]) {
    onProgress?.("Uploading cover image")

    try {
      uploadedCover = await uploadPublicFile({
        bucket: EVENT_IMAGE_BUCKET,
        file: cover[0],
        path: buildEventCoverImagePath(eventId, getImageExtension(cover[0])),
      })
      uploadedPaths.push(uploadedCover.path)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "upload_failed",
        uploadedCover,
        uploadedGallery,
        uploadedPaths,
      }
    }
  }

  for (const [index, file] of gallery.entries()) {
    onProgress?.(`Uploading gallery image ${index + 1} of ${gallery.length}`)

    try {
      const uploaded = await uploadPublicFile({
        bucket: EVENT_IMAGE_BUCKET,
        file,
        path: buildEventGalleryImagePath({
          eventId,
          extension: getImageExtension(file),
          fileName: file.name,
          index: index + 1,
        }),
      })
      uploadedGallery.push(uploaded)
      uploadedPaths.push(uploaded.path)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "upload_failed",
        uploadedCover,
        uploadedGallery,
        uploadedPaths,
      }
    }
  }

  return { uploadedCover, uploadedGallery, uploadedPaths }
}
