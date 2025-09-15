import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExchangeRateForm } from "@/components/settings/exchange-rate-form"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سعر الصرف</CardTitle>
              <CardDescription>
                إدارة سعر صرف العملات بين الدينار الأردني والتيثر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExchangeRateForm currentRate={exchangeRate.rate.toNumber()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معلومات النظام</CardTitle>
              <CardDescription>
                معلومات حول النظام والإعدادات الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">المنطقة الزمنية</span>
                  <span className="text-sm font-medium">Asia/Amman</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">العملة الأساسية</span>
                  <span className="text-sm font-medium">دينار أردني (JOD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">العملة الثانوية</span>
                  <span className="text-sm font-medium">تيثر (USDT)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">آخر تحديث لسعر الصرف</span>
                  <span className="text-sm font-medium">
                    {new Date(exchangeRate.updatedAt).toLocaleString("ar-JO", {
                      timeZone: "Asia/Amman",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}