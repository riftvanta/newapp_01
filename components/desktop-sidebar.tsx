"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  FileText,
  Calculator,
  BarChart3,
  Users,
  Settings,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

export function DesktopSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "الرئيسية",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      id: "accounts",
      label: "دليل الحسابات",
      icon: <FileText className="h-5 w-5" />,
      href: "/dashboard/accounts",
    },
    {
      id: "transactions",
      label: "القيود المحاسبية",
      icon: <Calculator className="h-5 w-5" />,
      href: "/dashboard/transactions",
    },
    {
      id: "reports",
      label: "التقارير",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/dashboard/reports",
    },
    {
      id: "users",
      label: "المستخدمون",
      icon: <Users className="h-5 w-5" />,
      href: "/dashboard/users",
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/settings",
    },
  ]

  const handleLogout = async () => {
    const response = await fetch("/api/logout", { method: "POST" })
    if (response.ok) {
      router.push("/login")
      router.refresh()
    }
  }

  const isActiveRoute = (href: string) => {
    if (pathname === href) return true
    if (href !== "/dashboard" && pathname.startsWith(href)) return true
    return false
  }

  return (
    <aside className="hidden sm:flex sm:flex-col sm:w-64 bg-white dark:bg-gray-900 border-l dark:border-gray-800 h-screen sticky top-0">
      {/* Header - matches the height of the top bar */}
      <div className="h-16 px-6 border-b dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">نظام المحاسبة</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href)

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-gray-900 dark:bg-gray-800 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t dark:border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-300 font-semibold">م</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">مدير النظام</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">admin</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </aside>
  )
}