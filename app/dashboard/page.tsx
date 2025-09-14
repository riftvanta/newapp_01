import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">مرحباً بك في لوحة التحكم</CardTitle>
            <CardDescription>
              أهلاً وسهلاً، {session.user?.name || "المشرف"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              هذه لوحة التحكم الخاصة بك. يمكنك إضافة المزيد من الميزات والوظائف هنا في المستقبل.
            </p>
            <div className="mt-4 sm:mt-6 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">المستخدمون</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold">1</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">مشرف واحد نشط</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">الحالة</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">نشط</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">النظام يعمل بشكل جيد</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">آخر تسجيل دخول</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold">الآن</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">جلسة نشطة</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}