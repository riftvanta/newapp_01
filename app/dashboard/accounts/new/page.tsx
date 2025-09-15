import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccountForm } from "@/components/accounts/account-form"
import { prisma } from "@/lib/prisma"

export default async function NewAccountPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Fetch all parent accounts server-side
  const parentAccounts = await prisma.account.findMany({
    where: {
      isParent: true
    },
    orderBy: [
      { accountType: "asc" },
      { code: "asc" }
    ]
  })

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <AccountForm mode="create" initialParentAccounts={parentAccounts} />
      </div>
    </DashboardLayout>
  )
}