import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccountsClient } from "./accounts-client"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const accountType = searchParams.type

  const where: any = {}
  if (accountType && accountType !== "ALL") {
    where.accountType = accountType
  }

  const accounts = await prisma.account.findMany({
    where,
    include: {
      parent: true,
      children: true,
    },
    orderBy: [{ accountType: "asc" }, { code: "asc" }],
  })

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <AccountsClient accounts={accounts} />
      </div>
    </DashboardLayout>
  )
}