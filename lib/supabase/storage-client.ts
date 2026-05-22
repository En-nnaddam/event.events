"use client"

import { createClient } from "@/lib/supabase/client"

type UploadPublicFileOptions = {
  bucket: string
  cacheControl?: string
  file: File
  path: string
}

export type UploadedPublicFile = {
  path: string
  publicUrl: string
}

const supabase = createClient()

export async function uploadPublicFile({
  bucket,
  cacheControl = "31536000",
  file,
  path,
}: UploadPublicFileOptions): Promise<UploadedPublicFile> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl,
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message || "upload_failed")
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return { path, publicUrl }
}

export async function removePublicFiles(bucket: string, paths: string[]) {
  if (paths.length === 0) {
    return
  }

  const { error } = await supabase.storage.from(bucket).remove(paths)

  if (error) {
    throw new Error(error.message || "cleanup_failed")
  }
}
