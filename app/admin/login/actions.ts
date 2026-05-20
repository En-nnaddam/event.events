"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export async function adminLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    redirect("/admin/login?error=invalid_credentials")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect("/admin/login?error=invalid_credentials")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle<{ role: string }>()

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut()
    redirect("/admin/login?error=invalid_credentials")
  }

  redirect("/admin")
}
