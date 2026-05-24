import type { SupabaseClient } from "@supabase/supabase-js"

type ProfileRole = "user" | "admin"

type ProfileRow = {
  role: ProfileRole
  full_name: string | null
}

export async function getSignedInDestination(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return "/auth"
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (!profile) {
    await supabase.auth.signOut()
    return "/auth?error=account_unavailable"
  }

  if (profile.role === "admin") {
    return "/admin"
  }

  if (!profile.full_name?.trim()) {
    return "/profile/setup"
  }

  return "/"
}
