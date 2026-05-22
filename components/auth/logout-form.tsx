import { signOutCurrentSession } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export function LogoutForm() {
  return (
    <form action={signOutCurrentSession}>
      <Button type="submit" variant="outline">
        Logout
      </Button>
    </form>
  )
}
