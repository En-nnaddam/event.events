import { redirect } from "next/navigation"

import { getSignedInDestination } from "@/lib/auth/destination"
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()
  redirect(await getSignedInDestination(supabase))
}
