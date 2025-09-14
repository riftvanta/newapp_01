'use server'

import { signOut } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function handleSignOut() {
  try {
    await signOut({ redirect: false })
  } catch (error) {
    console.error("Logout error:", error)
  } finally {
    redirect("/login")
  }
}