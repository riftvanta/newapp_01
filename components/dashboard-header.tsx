"use client"

import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "الرئيسية"
    if (pathname.startsWith("/dashboard/accounts")) return "دليل الحسابات"
    if (pathname.startsWith("/dashboard/transactions")) return "القيود المحاسبية"
    if (pathname.startsWith("/dashboard/reports")) return "التقارير"
    if (pathname.startsWith("/dashboard/users")) return "المستخدمون"
    if (pathname.startsWith("/dashboard/settings")) return "الإعدادات"
    return "لوحة التحكم"
  }

  const handleLogout = async () => {
    const response = await fetch("/api/logout", { method: "POST" })
    if (response.ok) {
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sm:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>

          {/* Mobile controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mt-2">
                <DropdownMenuItem className="text-right">
                  <User className="ml-2 h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-right text-red-600 focus:text-red-600"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop header - integrated with content area */}
      <header className="hidden sm:block bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="px-8 h-16 flex items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
        </div>
      </header>
    </>
  )
}