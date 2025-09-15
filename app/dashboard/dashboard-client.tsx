"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  PullToRefreshContainer,
  PullToRefreshIndicator,
  usePullToRefresh,
} from "@/components/ui/pull-to-refresh"

interface DashboardClientProps {
  children: React.ReactNode
}

export function DashboardClient({ children }: DashboardClientProps) {
  const router = useRouter()

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Refresh the page data
    router.refresh()
  }, [router])

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    isTriggered,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  })

  return (
    <PullToRefreshContainer ref={containerRef}>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        isTriggered={isTriggered}
      />
      {children}
    </PullToRefreshContainer>
  )
}