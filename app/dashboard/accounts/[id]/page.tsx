import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Edit } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatBalance, getAccountTypeName, getBalanceTypeName } from "@/lib/accounting"
import { notFound } from "next/navigation"
import { DeleteAccountButton } from "@/components/accounts/delete-account-button"

export default async function AccountDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      parent: true,
      children: {
        orderBy: { code: "asc" },
      },
    },
  })

  if (!account) {
    notFound()
  }

  const { formattedAmount, isNegative } = formatBalance(
    Number(account.currentBalance),
    account.normalBalance,
    account.currency
  )

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard/accounts">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">تفاصيل الحساب</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{account.nameAr}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  كود الحساب: {account.code}
                </p>
              </div>
              <div className="flex gap-2">
                {!account.hasTransactions && (
                  <>
                    <Link href={`/dashboard/accounts/${account.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 ml-2" />
                        تعديل
                      </Button>
                    </Link>
                    <DeleteAccountButton accountId={account.id} />
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">نوع الحساب</p>
                <p className="font-semibold">{getAccountTypeName(account.accountType)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الرصيد الطبيعي</p>
                <p className="font-semibold">{getBalanceTypeName(account.normalBalance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العملة</p>
                <p className="font-semibold">
                  {account.currency === "JOD" ? "دينار أردني" : "تيثر"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <p className="font-semibold">
                  {account.isParent ? "حساب رئيسي" : "حساب فرعي"}
                </p>
              </div>
              {account.parent && (
                <div>
                  <p className="text-sm text-muted-foreground">الحساب الرئيسي</p>
                  <Link
                    href={`/dashboard/accounts/${account.parent.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {account.parent.nameAr}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">الرصيد الافتتاحي</p>
                <p className="font-semibold">
                  {account.openingBalance.toString()} {account.currency === "JOD" ? "د.أ" : "USDT"}
                  {account.openingBalanceType && ` (${getBalanceTypeName(account.openingBalanceType)})`}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">الرصيد الحالي</p>
                <p className={`text-2xl font-bold ${isNegative ? "text-red-600" : ""}`}>
                  {formattedAmount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {account.children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>الحسابات الفرعية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {account.children.map((child) => {
                  const childBalance = formatBalance(
                    Number(child.currentBalance),
                    child.normalBalance,
                    child.currency
                  )
                  return (
                    <Link
                      key={child.id}
                      href={`/dashboard/accounts/${child.id}`}
                      className="flex justify-between items-center p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{child.nameAr}</p>
                        <p className="text-sm text-muted-foreground">
                          {child.code}
                        </p>
                      </div>
                      <p
                        className={`font-semibold ${
                          childBalance.isNegative ? "text-red-600" : ""
                        }`}
                      >
                        {childBalance.formattedAmount}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}