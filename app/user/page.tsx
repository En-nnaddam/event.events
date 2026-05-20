import { createClient } from "@/lib/supabase/server"

export default async function UserPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .maybeSingle<{ full_name: string | null }>()

  return (
    <main className="min-h-svh bg-background p-6">
      <section className="mx-auto max-w-3xl py-12">
        <p className="text-sm font-medium text-muted-foreground">User area</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Your account is ready. This is the protected user home where favorites and event discovery can plug in next.
        </p>
      </section>
    </main>
  )
}
