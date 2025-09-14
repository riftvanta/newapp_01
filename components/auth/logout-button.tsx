'use client'

import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
    >
      خروج
    </Button>
  )
}