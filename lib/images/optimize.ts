"use client"

import { MAX_EVENT_IMAGE_SIZE } from "@/lib/admin/events"

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]

export type OptimizedImage = {
  file: File
  originalSize: number
  optimizedSize: number
  width: number
  height: number
  type: string
}

type OptimizeImageOptions = {
  maxDimension?: number
  quality?: number
}

export function validateImageFile(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    return "invalid_image_type"
  }

  if (file.size > MAX_EVENT_IMAGE_SIZE) {
    return "image_too_large"
  }

  return null
}

function getTargetSize(width: number, height: number, maxDimension: number) {
  const largestDimension = Math.max(width, height)

  if (largestDimension <= maxDimension) {
    return { width, height }
  }

  const ratio = maxDimension / largestDimension

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

async function decodeImage(file: File) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file)
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image could not be decoded."))
    }
    image.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

export async function optimizeImage(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: OptimizeImageOptions = {}
): Promise<OptimizedImage> {
  const validationError = validateImageFile(file)

  if (validationError) {
    throw new Error(validationError)
  }

  const image = await decodeImage(file)
  const targetSize = getTargetSize(image.width, image.height, maxDimension)
  const canvas = document.createElement("canvas")
  canvas.width = targetSize.width
  canvas.height = targetSize.height

  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("image_optimization_failed")
  }

  context.drawImage(image, 0, 0, targetSize.width, targetSize.height)

  if ("close" in image && typeof image.close === "function") {
    image.close()
  }

  const webpBlob = await canvasToBlob(canvas, "image/webp", quality)
  const fallbackBlob =
    webpBlob ?? (await canvasToBlob(canvas, "image/jpeg", quality))
  const blob = fallbackBlob ?? file
  const extension = blob.type === "image/webp" ? "webp" : "jpg"
  const name = file.name.replace(/\.[^.]+$/, "")
  const optimizedFile = new File([blob], `${name}.${extension}`, {
    type: blob.type || "image/jpeg",
    lastModified: Date.now(),
  })

  return {
    file: optimizedFile,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    width: targetSize.width,
    height: targetSize.height,
    type: optimizedFile.type,
  }
}

export function formatImageSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
