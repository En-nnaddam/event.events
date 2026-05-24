import { signOutCurrentSession } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LogoutFormProps = {
  className?: string
  buttonClassName?: string
}

export function LogoutForm({ className, buttonClassName }: LogoutFormProps) {
  return (
    <form action={signOutCurrentSession} className={className}>
      <Button type="submit" variant="outline" className={cn(buttonClassName)}>
        Logout
      </Button>
    </form>
  )
}
