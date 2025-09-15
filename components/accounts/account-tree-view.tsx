"use client"

import { useState, useEffect, useMemo } from "react"
import { Account, AccountType } from "@prisma/client"
import { AccountTreeNode } from "./account-tree-node"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  buildAccountTree,
  searchAccounts,
  getExpandedState,
  saveExpandedState,
  TreeNode,
  TreeAccount
} from "@/lib/account-tree-utils"
import { getAccountTypeName } from "@/lib/accounting"
import { Search, ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountTreeViewProps {
  accounts: TreeAccount[]
}

export function AccountTreeView({ accounts }: AccountTreeViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [expandAll, setExpandAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = getExpandedState()
    setExpandedNodes(saved)

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save expanded state to localStorage
  useEffect(() => {
    saveExpandedState(expandedNodes)
  }, [expandedNodes])

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Record<AccountType, TreeAccount[]> = {
      ASSET: [],
      LIABILITY: [],
      EQUITY: [],
      REVENUE: [],
      EXPENSE: []
    }

    accounts.forEach(account => {
      groups[account.accountType].push(account)
    })

    return groups
  }, [accounts])

  // Build tree structure for each account type
  const trees = useMemo(() => {
    const result: Record<AccountType, TreeNode[]> = {
      ASSET: [],
      LIABILITY: [],
      EQUITY: [],
      REVENUE: [],
      EXPENSE: []
    }

    Object.entries(groupedAccounts).forEach(([type, typeAccounts]) => {
      const tree = buildAccountTree(typeAccounts)
      const filtered = searchTerm
        ? searchAccounts(tree, searchTerm)
        : tree
      result[type as AccountType] = filtered
    })

    return result
  }, [groupedAccounts, searchTerm])

  const handleToggleExpand = (accountId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }))
  }

  const handleExpandAll = () => {
    if (expandAll) {
      // Collapse all
      setExpandedNodes({})
      setExpandAll(false)
    } else {
      // Expand all parent accounts
      const allParentIds: Record<string, boolean> = {}
      accounts.forEach(account => {
        if (account.isParent || (account.children && account.children.length > 0)) {
          allParentIds[account.id] = true
        }
      })
      setExpandedNodes(allParentIds)
      setExpandAll(true)
    }
  }

  const totalAccounts = accounts.length

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <Card className="p-3 sm:p-4 sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="بحث بالكود أو الاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              className="whitespace-nowrap"
            >
              {expandAll ? (
                <>
                  <Minimize2 className="h-4 w-4 ml-2" />
                  <span className="hidden sm:inline">طي الكل</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 ml-2" />
                  <span className="hidden sm:inline">توسيع الكل</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Account count */}
        <div className="mt-2 text-xs sm:text-sm text-gray-500">
          إجمالي الحسابات: {totalAccounts}
          {searchTerm && ` • نتائج البحث: ${Object.values(trees).flat().length}`}
        </div>
      </Card>

      {/* Tree View by Account Type */}
      <div className="space-y-4">
        {Object.entries(trees).map(([type, nodes]) => {
          if (nodes.length === 0) return null

          return (
            <Card key={type} className="overflow-hidden">
              {/* Type Header */}
              <div className={cn(
                "px-3 sm:px-4 py-2 sm:py-3 font-semibold",
                "bg-gray-50 dark:bg-gray-800 border-b",
                "sticky top-0 z-5"
              )}>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">
                    {getAccountTypeName(type as AccountType)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {nodes.length} حساب
                  </span>
                </div>
              </div>

              {/* Tree Nodes */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {nodes.map((node) => (
                  <AccountTreeNode
                    key={node.account.id}
                    node={node}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                    searchTerm={searchTerm}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* No Results Message */}
      {Object.values(trees).every(nodes => nodes.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm
              ? `لا توجد نتائج للبحث "${searchTerm}"`
              : "لا توجد حسابات"}
          </p>
        </div>
      )}

      {/* Mobile scroll indicator for nested items */}
      {isMobile && (
        <div className="fixed bottom-24 left-4 right-4 pointer-events-none">
          <div className="bg-gradient-to-l from-transparent via-gray-100/50 to-transparent h-px" />
        </div>
      )}
    </div>
  )
}