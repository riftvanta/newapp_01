"use client"

import { usePathname } from "next/navigation"

export function DashboardHeader() {
  const pathname = usePathname()

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

  return (
    <>
      {/* Mobile header */}
      <header className="sm:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
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