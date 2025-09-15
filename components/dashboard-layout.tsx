import { DashboardHeader } from "@/components/dashboard-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Desktop sidebar - full height */}
        <DesktopSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top header for mobile and content area for desktop */}
          <DashboardHeader />

          {/* Main content with padding for mobile bottom nav */}
          <main className="flex-1 pb-20 sm:pb-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  )
}