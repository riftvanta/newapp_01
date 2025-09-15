import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Clear the NextAuth session token cookie
    cookies().set("authjs.session-token", "", {
      expires: new Date(0),
      path: "/",
    })

    // Also clear the secure version (used in production)
    cookies().set("__Secure-authjs.session-token", "", {
      expires: new Date(0),
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax"
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
}