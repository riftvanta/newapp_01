"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, BarChart3, Settings, FileText, Users } from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("home")

  useEffect(() => {
    // Update active tab based on current pathname
    const path = pathname.split('/').pop() || 'dashboard'
    setActiveTab(path === 'dashboard' ? 'home' : path)
  }, [pathname])

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "الرئيسية",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      id: "accounts",
      label: "الحسابات",
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
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      {/* Glass morphism background with shadow */}
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]" />

      {/* Navigation items */}
      <nav className="relative flex items-center justify-around h-16 px-2 safe-bottom">
        {navItems.map((item) => {
          const isActive = item.href === pathname || item.id === activeTab

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full py-2 transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${
                isActive ? "bg-primary/10" : ""
              }`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}