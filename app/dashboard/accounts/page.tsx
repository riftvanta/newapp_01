import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccountsClient } from "./accounts-client"
import { prisma } from "@/lib/prisma"

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string; limit?: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const accountType = searchParams.type
  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "20")
  const skip = (page - 1) * limit

  const where: any = {}
  if (accountType && accountType !== "ALL") {
    where.accountType = accountType
  }

  // Get total count for pagination
  const totalCount = await prisma.account.count({ where })
  const totalPages = Math.ceil(totalCount / limit)

  // Only fetch relations for tree view - optimize for grid view
  const accounts = await prisma.account.findMany({
    where,
    include: {
      parent: true,
      children: {
        select: {
          id: true,
          code: true,
          nameAr: true,
        }
      },
    },
    orderBy: [{ accountType: "asc" }, { code: "asc" }],
    skip,
    take: limit,
  })

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <AccountsClient
          accounts={accounts}
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      </div>
    </DashboardLayout>
  )
}