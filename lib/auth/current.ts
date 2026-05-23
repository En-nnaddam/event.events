import type { SupabaseClient } from "@supabase/supabase-js"

export type CurrentAuth =
  | {
      status: "signed_out"
    }
  | {
      status: "signed_in"
      role: "user" | "admin"
      fullName: string | null
      avatarUrl: string | null
      destination: string
    }

type ProfileRow = {
  role: "user" | "admin"
  full_name: string | null
  avatar_url: string | null
}

export async function getCurrentAuth(supabase: SupabaseClient): Promise<CurrentAuth> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "signed_out" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (!profile) {
    return { status: "signed_out" }
  }

  return {
    status: "signed_in",
    role: profile.role,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    destination: profile.role === "admin" ? "/admin" : "/",
  }
}
