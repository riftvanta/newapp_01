import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database connection failed",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}