"use client"

import React from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  isTriggered: boolean
  threshold?: number
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isTriggered,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  // Calculate rotation based on pull distance
  const rotation = Math.min((pullDistance / threshold) * 180, 180)
  const opacity = Math.min(pullDistance / threshold, 1)
  const scale = 0.8 + Math.min(pullDistance / threshold, 1) * 0.2

  if (pullDistance === 0 && !isRefreshing) return null

  return (
    <div
      className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50 transition-transform duration-300 ease-out"
      style={{
        transform: `translateY(${pullDistance}px)`,
      }}
    >
      <div
        className="mt-4 flex flex-col items-center gap-2 transition-opacity"
        style={{ opacity }}
      >
        <div
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg",
            isRefreshing && "animate-pulse"
          )}
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <RefreshCw
            className={cn(
              "h-5 w-5 text-primary transition-transform",
              isRefreshing && "animate-spin",
              isTriggered && !isRefreshing && "text-green-500"
            )}
            style={{
              transform: !isRefreshing ? `rotate(${rotation}deg)` : undefined,
            }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {isRefreshing
            ? "جاري التحديث..."
            : isTriggered
            ? "اترك للتحديث"
            : "اسحب للتحديث"}
        </span>
      </div>
    </div>
  )
}

interface PullToRefreshContainerProps {
  children: React.ReactNode
  className?: string
}

export const PullToRefreshContainer = React.forwardRef<
  HTMLDivElement,
  PullToRefreshContainerProps
>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative min-h-screen overscroll-y-contain",
        className
      )}
    >
      {children}
    </div>
  )
})

PullToRefreshContainer.displayName = "PullToRefreshContainer"

// Re-export for convenience
export { usePullToRefresh } from "@/hooks/usePullToRefresh"