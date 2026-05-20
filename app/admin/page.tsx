import { createClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  const supabase = await createClient()
  const { count: publishedEvents } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")

  const { count: archivedEvents } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "archived")

  return (
    <main className="min-h-svh bg-background p-6">
      <section className="mx-auto max-w-4xl py-12">
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Admin dashboard</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Published events</p>
            <p className="mt-2 text-3xl font-semibold">{publishedEvents ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Archived events</p>
            <p className="mt-2 text-3xl font-semibold">{archivedEvents ?? 0}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
