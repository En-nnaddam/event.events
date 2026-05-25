import { revalidatePath } from "next/cache"

export function revalidateEventConsumers(eventId?: string) {
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/events")

  if (eventId) {
    revalidatePath(`/admin/events/${eventId}/edit`)
  }
}

export function revalidateCategoryConsumers() {
  revalidateEventConsumers()
  revalidatePath("/admin/events/new")
  revalidatePath("/admin/categories")
}
