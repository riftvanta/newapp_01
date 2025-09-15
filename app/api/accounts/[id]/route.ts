import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidateTag } from "next/cache"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: {
          orderBy: { code: "asc" }
        }
      }
    })

    if (!account) {
      return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error fetching account:", error)
    return NextResponse.json(
      { error: "حدث خطأ في جلب الحساب" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { nameAr, currency, openingBalance, openingBalanceType } = body

    const existingAccount = await prisma.account.findUnique({
      where: { id: params.id }
    })

    if (!existingAccount) {
      return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 })
    }

    // Don't allow changing opening balance if account has transactions
    if (existingAccount.hasTransactions && openingBalance !== undefined) {
      return NextResponse.json(
        { error: "لا يمكن تغيير الرصيد الافتتاحي لحساب به حركات" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (nameAr !== undefined) updateData.nameAr = nameAr
    if (currency !== undefined) updateData.currency = currency
    if (openingBalance !== undefined && !existingAccount.isParent) {
      updateData.openingBalance = openingBalance
      updateData.currentBalance = openingBalance
    }
    if (openingBalanceType !== undefined && !existingAccount.isParent) {
      updateData.openingBalanceType = openingBalanceType
    }

    const account = await prisma.account.update({
      where: { id: params.id },
      data: updateData,
      include: {
        parent: true,
        children: true
      }
    })

    // Update parent balance if this is a child account
    if (account.parentId && openingBalance !== undefined) {
      await updateParentBalance(account.parentId)
    }

    // Revalidate accounts cache
    revalidateTag('accounts')

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error updating account:", error)
    return NextResponse.json(
      { error: "حدث خطأ في تحديث الحساب" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: { children: true }
    })

    if (!account) {
      return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 })
    }

    // Don't allow deletion if account has transactions
    if (account.hasTransactions) {
      return NextResponse.json(
        { error: "لا يمكن حذف حساب به حركات" },
        { status: 400 }
      )
    }

    // Don't allow deletion if account has children
    if (account.children.length > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف حساب رئيسي به حسابات فرعية" },
        { status: 400 }
      )
    }

    const parentId = account.parentId

    await prisma.account.delete({
      where: { id: params.id }
    })

    // Update parent balance if this was a child account
    if (parentId) {
      await updateParentBalance(parentId)
    }

    // Revalidate accounts cache
    revalidateTag('accounts')

    return NextResponse.json({ message: "تم حذف الحساب بنجاح" })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "حدث خطأ في حذف الحساب" },
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