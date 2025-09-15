import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    let exchangeRate = await prisma.exchangeRate.findFirst()

    // Create default exchange rate if none exists
    if (!exchangeRate) {
      exchangeRate = await prisma.exchangeRate.create({
        data: {
          rate: 0.71,
          updatedBy: session.user?.name || "admin"
        }
      })
    }

    return NextResponse.json(exchangeRate)
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
    return NextResponse.json(
      { error: "حدث خطأ في جلب سعر الصرف" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { rate } = body

    if (!rate || rate <= 0) {
      return NextResponse.json(
        { error: "سعر الصرف يجب أن يكون أكبر من صفر" },
        { status: 400 }
      )
    }

    let exchangeRate = await prisma.exchangeRate.findFirst()

    if (exchangeRate) {
      exchangeRate = await prisma.exchangeRate.update({
        where: { id: exchangeRate.id },
        data: {
          rate,
          updatedBy: session.user?.name || "admin"
        }
      })
    } else {
      exchangeRate = await prisma.exchangeRate.create({
        data: {
          rate,
          updatedBy: session.user?.name || "admin"
        }
      })
    }

    return NextResponse.json(exchangeRate)
  } catch (error) {
    console.error("Error updating exchange rate:", error)
    return NextResponse.json(
      { error: "حدث خطأ في تحديث سعر الصرف" },
      { status: 500 }
    )
  }
}