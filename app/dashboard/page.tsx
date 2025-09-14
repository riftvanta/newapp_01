import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { handleSignOut } from "@/app/actions/auth"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline">
                خروج
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">مرحباً بك في لوحة التحكم</CardTitle>
            <CardDescription>
              أهلاً وسهلاً، {session.user?.name || "المشرف"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              هذه لوحة التحكم الخاصة بك. يمكنك إضافة المزيد من الميزات والوظائف هنا في المستقبل.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">مشرف واحد نشط</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">الحالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">نشط</div>
                  <p className="text-xs text-muted-foreground">النظام يعمل بشكل جيد</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">آخر تسجيل دخول</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">الآن</div>
                  <p className="text-xs text-muted-foreground">جلسة نشطة</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}