"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  resistance?: number
  maxPull?: number
  disabled?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  maxPull = 150,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return

    const touch = e.touches[0]
    startY.current = touch.clientY

    // Only allow pull-to-refresh when scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop === 0) {
      setIsPulling(true)
    }
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return

    const touch = e.touches[0]
    currentY.current = touch.clientY

    const distance = currentY.current - startY.current

    if (distance > 0) {
      // Apply resistance factor
      const resistedDistance = Math.min(distance / resistance, maxPull)
      setPullDistance(resistedDistance)

      // Prevent default scrolling when pulling
      if (resistedDistance > 10) {
        e.preventDefault()
      }
    }
  }, [isPulling, disabled, isRefreshing, resistance, maxPull])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled || isRefreshing) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }

      setIsRefreshing(true)
      setPullDistance(60) // Keep indicator visible during refresh

      try {
        await onRefresh()
      } catch (error) {
        console.error("Refresh failed:", error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Snap back if threshold not reached
      setPullDistance(0)
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Only enable on touch devices
    if (!('ontouchstart' in window)) return

    const element = containerRef.current || document.body

    // Add passive: false to prevent scrolling when pulling
    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchmove", handleTouchMove, { passive: false })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling,
    isTriggered: pullDistance >= threshold,
  }
}