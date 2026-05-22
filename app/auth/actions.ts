"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

async function getSiteUrl() {
  const headerList = await headers()
  const origin = headerList.get("origin")

  if (origin) {
    return origin
  }

  const host = headerList.get("host")
  const protocol = headerList.get("x-forwarded-proto") ?? "http"

  if (host) {
    return `${protocol}://${host}`
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function startGoogleAuth() {
  const supabase = await createClient()
  const siteUrl = await getSiteUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  })

  if (error || !data.url) {
    redirect("/auth?error=google_start_failed")
  }

  redirect(data.url)
}

export async function signOutCurrentSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let redirectTo = "/"

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: "user" | "admin" }>()

    if (profile?.role === "admin") {
      redirectTo = "/admin/login"
    }
  }

  await supabase.auth.signOut({ scope: "local" })
  redirect(redirectTo)
}
