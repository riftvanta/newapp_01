import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getNormalBalance, getAccountTypeRange } from "@/lib/accounting"
import { revalidateTag } from "next/cache"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const accountType = searchParams.get("type")
    const parentOnly = searchParams.get("parentOnly") === "true"

    const where: any = {}
    if (accountType) {
      where.accountType = accountType
    }
    if (parentOnly) {
      where.isParent = true
    }

    // Only include relations if specifically requested
    const includeRelations = searchParams.get("includeRelations") === "true"

    const accounts = await prisma.account.findMany({
      where,
      include: includeRelations ? {
        parent: true,
        children: true
      } : undefined,
      orderBy: [
        { accountType: "asc" },
        { code: "asc" }
      ]
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      { error: "حدث خطأ في جلب الحسابات" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const {
      nameAr,
      accountType,
      parentId,
      isParent,
      currency,
      openingBalance,
      openingBalanceType
    } = body

    // Validate Arabic name
    if (!nameAr || nameAr.trim() === "") {
      return NextResponse.json(
        { error: "اسم الحساب مطلوب" },
        { status: 400 }
      )
    }

    // Get the normal balance for this account type
    const normalBalance = getNormalBalance(accountType)

    // Generate account code
    const range = getAccountTypeRange(accountType)
    let code: string

    if (isParent) {
      // Parent accounts get round numbers
      const existingParents = await prisma.account.count({
        where: {
          accountType,
          isParent: true
        }
      })
      code = (range.min + existingParents * 100).toString()

      // Check if we've exceeded the range
      if (parseInt(code) > range.max) {
        return NextResponse.json(
          { error: "تم الوصول للحد الأقصى من الحسابات الرئيسية لهذا النوع" },
          { status: 400 }
        )
      }
    } else {
      // Child accounts get sequential numbers
      let baseCode = range.min

      if (parentId) {
        const parent = await prisma.account.findUnique({
          where: { id: parentId }
        })
        if (parent) {
          baseCode = parseInt(parent.code)
        }
      }

      // Find the next available code
      const lastChild = await prisma.account.findFirst({
        where: {
          code: {
            gte: baseCode.toString(),
            lt: (baseCode + 100).toString()
          },
          isParent: false
        },
        orderBy: { code: "desc" }
      })

      if (lastChild) {
        code = (parseInt(lastChild.code) + 1).toString()
      } else {
        code = (baseCode + 1).toString()
      }

      // Check if we've exceeded the range
      if (parseInt(code) > range.max || parseInt(code) >= baseCode + 100) {
        return NextResponse.json(
          { error: "تم الوصول للحد الأقصى من الحسابات الفرعية" },
          { status: 400 }
        )
      }
    }

    // Create the account
    const account = await prisma.account.create({
      data: {
        code,
        nameAr,
        accountType,
        parentId,
        isParent,
        currency,
        openingBalance: openingBalance || 0,
        openingBalanceType: isParent ? null : openingBalanceType,
        currentBalance: openingBalance || 0,
        normalBalance,
        createdBy: session.user?.name || "admin"
      },
      include: {
        parent: true,
        children: true
      }
    })

    // If this is a child account with opening balance, update parent's balance
    if (parentId && openingBalance) {
      await updateParentBalance(parentId)
    }

    // Revalidate accounts cache
    revalidateTag('accounts')

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Error creating account:", error)
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الحساب" },
      { status: 500 }
    )
  }
}

async function updateParentBalance(parentId: string) {
  const parent = await prisma.account.findUnique({
    where: { id: parentId },
    include: { children: true }
  })

  if (!parent || !parent.isParent) return

  // Calculate sum of children balances
  const totalBalance = parent.children.reduce((sum, child) => {
    return sum + child.currentBalance.toNumber()
  }, 0)

  await prisma.account.update({
    where: { id: parentId },
    data: { currentBalance: totalBalance }
  })

  // Recursively update grandparent if exists
  if (parent.parentId) {
    await updateParentBalance(parent.parentId)
  }
}