"use client"

import { useState } from "react"
import { TreeNode } from "@/lib/account-tree-utils"
import { formatBalance, getBalanceTypeName } from "@/lib/accounting"
import { ChevronRight, ChevronDown, Edit, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AccountTreeNodeProps {
  node: TreeNode
  expandedNodes: Record<string, boolean>
  onToggleExpand: (accountId: string) => void
  searchTerm?: string
  isMobile?: boolean
}

export function AccountTreeNode({
  node,
  expandedNodes,
  onToggleExpand,
  searchTerm = "",
  isMobile = false
}: AccountTreeNodeProps) {
  const { account, children, level } = node
  const isExpanded = expandedNodes[account.id] || false
  const hasChildren = children && children.length > 0
  const [showActions, setShowActions] = useState(false)

  const { formattedAmount, isNegative } = formatBalance(
    Number(account.currentBalance),
    account.normalBalance,
    account.currency
  )

  // Calculate responsive indentation
  const indentSize = isMobile ? 12 : level < 3 ? 20 : 28
  const indent = level * indentSize

  // Highlight search term
  const highlightText = (text: string) => {
    if (!searchTerm) return text
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasChildren) {
      onToggleExpand(account.id)
    }
  }

  return (
    <>
      <div
        className={cn(
          "group relative border-b border-gray-100 dark:border-gray-800",
          "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
          "min-h-[48px] sm:min-h-[44px]", // Mobile-first touch targets
          level === 0 && "font-semibold bg-gray-50/50 dark:bg-gray-800/30"
        )}
        style={{ paddingRight: `${indent}px` }}
      >
        <div
          className={cn(
            "flex items-center justify-between",
            "px-3 sm:px-4 py-3 sm:py-2",
            "cursor-pointer select-none"
          )}
          onClick={handleToggle}
        >
          {/* Right side - Account info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Expand/Collapse Icon */}
            <button
              className={cn(
                "flex-shrink-0 p-1 -m-1 rounded",
                "hover:bg-gray-200 dark:hover:bg-gray-700",
                "transition-all duration-200",
                !hasChildren && "invisible"
              )}
              onClick={handleToggle}
              aria-label={isExpanded ? "طي" : "توسيع"}
            >
              {hasChildren && (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 rtl:rotate-180" />
                )
              )}
            </button>

            {/* Account Code & Name */}
            <div className="flex-1 min-w-0">
              {/* Mobile: Horizontal layout */}
              <div className="sm:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {highlightText(account.code)}
                  </span>
                  {account.isParent && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      رئيسي
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {highlightText(account.nameAr)}
                </div>
              </div>

              {/* Desktop: Original layout */}
              <div className="hidden sm:flex sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-xs sm:text-sm font-mono text-gray-500 dark:text-gray-400">
                  {highlightText(account.code)}
                </span>
                <span className="text-sm sm:text-base truncate">
                  {highlightText(account.nameAr)}
                </span>
                {account.isParent && (
                  <span className="inline-flex text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    رئيسي
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Left side - Balance & Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Balance */}
            <div className="text-left">
              <div className={cn(
                "font-semibold",
                isNegative && "text-red-600 dark:text-red-400"
              )}>
                {formattedAmount}
              </div>
              {hasChildren && (
                <div className="text-xs text-gray-500">
                  {children.length} حساب فرعي
                </div>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Link href={`/dashboard/accounts/${account.id}`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              {!account.hasTransactions && (
                <Link href={`/dashboard/accounts/${account.id}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Balance and Actions */}
          <div className="sm:hidden flex items-center gap-2">
            {/* Balance */}
            <div className="text-left">
              <div className={cn(
                "text-sm font-semibold",
                isNegative && "text-red-600 dark:text-red-400"
              )}>
                {formattedAmount}
              </div>
              {hasChildren && (
                <div className="text-xs text-gray-500">
                  {children.length} فرعي
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowActions(!showActions)
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/accounts/${account.id}`}>
                    <Eye className="h-4 w-4 ml-2" />
                    عرض
                  </Link>
                </DropdownMenuItem>
                {!account.hasTransactions && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/accounts/${account.id}/edit`}>
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Level indicator line (subtle) */}
        {level > 0 && (
          <div
            className="absolute right-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
            style={{ right: `${indent - indentSize / 2}px` }}
          />
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {children.map((childNode) => (
            <AccountTreeNode
              key={childNode.account.id}
              node={childNode}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              searchTerm={searchTerm}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </>
  )
}