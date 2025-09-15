"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, FileText, BarChart3, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

export function DesktopSidebar() {
  const pathname = usePathname()

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
      id: "analytics",
      label: "التحليلات",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/dashboard/analytics",
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

  return (
    <aside className="hidden sm:flex sm:flex-col sm:w-64 bg-white dark:bg-gray-800 border-l dark:border-gray-700">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}