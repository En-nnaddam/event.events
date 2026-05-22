"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import { slugify } from "@/lib/admin/events"

type CategoryPayload = {
  name: string
  slug: string
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function redirectWithError(error: string): never {
  redirect(`/admin/categories?error=${error}`)
}

function parseCategoryPayload(formData: FormData): CategoryPayload {
  const name = getText(formData, "name")
  if (!name) {
    redirectWithError("missing_fields")
  }

  const slug = slugify(name)


  return { name, slug }
}

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.toLowerCase().includes("duplicate")
}

function revalidateCategoryConsumers() {
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/events")
  revalidatePath("/admin/events/new")
  revalidatePath("/admin/categories")
}

export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin()
  const payload = parseCategoryPayload(formData)

  const { error } = await supabase.from("categories").insert(payload)

  if (error) {
    redirectWithError(isDuplicateSlugError(error) ? "duplicate_slug" : "save_failed")
  }

  revalidateCategoryConsumers()
  redirect("/admin/categories")
}

export async function updateCategory(formData: FormData) {
  const categoryId = getText(formData, "category_id")

  if (!categoryId) {
    redirectWithError("missing_category")
  }

  const { supabase } = await requireAdmin()
  const payload = parseCategoryPayload(formData)
  const { error } = await supabase.from("categories").update(payload).eq("id", categoryId)

  if (error) {
    redirectWithError(isDuplicateSlugError(error) ? "duplicate_slug" : "save_failed")
  }

  revalidateCategoryConsumers()
  redirect("/admin/categories")
}

export async function deleteCategory(formData: FormData) {
  const categoryId = getText(formData, "category_id")

  if (!categoryId) {
    redirectWithError("missing_category")
  }

  const { supabase } = await requireAdmin()
  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)

  if ((count ?? 0) > 0) {
    redirectWithError("category_in_use")
  }

  const { error } = await supabase.from("categories").delete().eq("id", categoryId)

  if (error) {
    redirectWithError("delete_failed")
  }

  revalidateCategoryConsumers()
  redirect("/admin/categories")
}
