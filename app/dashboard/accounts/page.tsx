import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccountCard } from "@/components/accounts/account-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { PrismaClient } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  // Group accounts by type for better display
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.accountType
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(account)
    return acc
  }, {} as Record<string, typeof accounts>)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">دليل الحسابات</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/dashboard/accounts/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 ml-2" />
                حساب جديد
              </Button>
            </Link>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              لم يتم إنشاء أي حسابات بعد
            </p>
            <Link href="/dashboard/accounts/new">
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء أول حساب
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
              <div key={type}>
                <h2 className="text-lg font-semibold mb-3">
                  {type === "ASSET" && "الأصول"}
                  {type === "LIABILITY" && "الخصوم"}
                  {type === "EQUITY" && "حقوق الملكية"}
                  {type === "REVENUE" && "الإيرادات"}
                  {type === "EXPENSE" && "المصروفات"}
                  <span className="text-sm font-normal text-muted-foreground mr-2">
                    ({typeAccounts.length} حساب)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAccounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <Link
        href="/dashboard/accounts/new"
        className="fixed bottom-20 left-4 z-40 sm:hidden"
      >
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </DashboardLayout>
  )
}