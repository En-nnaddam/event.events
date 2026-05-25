"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

function getRequiredFullName(formData: FormData) {
  const value = formData.get("full_name")

  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

export async function completeProfile(formData: FormData) {
  const fullName = getRequiredFullName(formData)

  if (!fullName) {
    redirect("/profile/setup?error=missing_fields")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id)

  if (error) {
    redirect("/profile/setup?error=save_failed")
  }

  redirect("/user")
}
