"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { handleSignOut } from "@/app/actions/auth"

export function DashboardHeader() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">لوحة التحكم</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={handleSignOut}>
              <Button type="submit" variant="outline">
                خروج
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}