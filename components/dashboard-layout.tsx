import { DashboardHeader } from "@/components/dashboard-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />

      {/* Main content with padding for mobile bottom nav */}
      <main className="pb-20 sm:pb-0">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  )
}