import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname

  // Protected routes
  const isProtectedRoute = pathname.startsWith("/dashboard") ||
                          pathname.startsWith("/api/accounts") ||
                          pathname.startsWith("/api/settings")

  const isAuthRoute = pathname.startsWith("/login") ||
                     pathname.startsWith("/api/auth")

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if logged in and trying to access login
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/accounts/:path*",
    "/api/settings/:path*",
    "/login",
    "/"
  ]
}