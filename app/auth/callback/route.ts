import { NextResponse } from "next/server"

import { getSignedInDestination } from "@/lib/auth/destination"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=missing_code", requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL("/auth?error=callback_failed", requestUrl.origin))
  }

  return NextResponse.redirect(new URL(await getSignedInDestination(supabase), requestUrl.origin))
}
