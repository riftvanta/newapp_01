"use client"

import { useState } from "react"
import { AccountCard } from "@/components/accounts/account-card"
import { AccountTreeView } from "@/components/accounts/account-tree-view"
import { Button } from "@/components/ui/button"
import { Plus, Grid3x3, TreePine } from "lucide-react"
import Link from "next/link"
import { saveViewMode } from "@/lib/account-tree-utils"
import type { Account } from "@prisma/client"

interface AccountsClientProps {
  accounts: (Account & {
    parent?: Account | null
    children?: any[]
  })[]
  currentPage: number
  totalPages: number
  totalCount: number
}

export function AccountsClientImpl({ accounts, currentPage, totalPages, totalCount }: AccountsClientProps) {
  // Since this component is only rendered on client-side (no SSR),
  // we can safely read localStorage directly
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>(() => {
    const stored = localStorage.getItem('accountViewMode')
    return stored === 'tree' ? 'tree' : 'grid'
  })

  const handleViewModeChange = (mode: 'grid' | 'tree') => {
    setViewMode(mode)
    saveViewMode(mode)
  }

  // Group accounts by type for grid view
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.accountType
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(account)
    return acc
  }, {} as Record<string, typeof accounts>)

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        {/* Title */}
        <h1 className="text-2xl font-bold">دليل الحسابات</h1>

        {/* Controls Row - View Toggle and New Account Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle - Enhanced for mobile */}
          <div className="flex gap-1 bg-gradient-to-b from-gray-100 to-gray-150 dark:from-gray-800 dark:to-gray-850 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`
                h-10 px-3 sm:h-8 sm:px-3
                rounded-md font-medium text-sm
                inline-flex items-center justify-center gap-2
                transition-all duration-200
                ${viewMode === 'grid'
                  ? 'shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white scale-105'
                  : 'bg-transparent hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }
              `}
              aria-label="عرض شبكي"
            >
              <Grid3x3 className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">شبكة</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('tree')}
              className={`
                h-10 px-3 sm:h-8 sm:px-3
                rounded-md font-medium text-sm
                inline-flex items-center justify-center gap-2
                transition-all duration-200
                ${viewMode === 'tree'
                  ? 'shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white scale-105'
                  : 'bg-transparent hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }
              `}
              aria-label="عرض شجري"
            >
              <TreePine className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">شجرة</span>
            </button>
          </div>

          {/* New Account Button - Enhanced for mobile */}
          <Link href="/dashboard/accounts/new">
            <Button
              size="sm"
              className="h-10 px-4 sm:h-8 sm:px-3 font-medium shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4 ml-2" />
              <span className="text-sm sm:text-sm">حساب جديد</span>
            </Button>
          </Link>
        </div>

        {/* Pagination Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          عرض {accounts.length} من {totalCount} حساب
          {totalPages > 1 && ` • صفحة ${currentPage} من ${totalPages}`}
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            لم يتم إنشاء أي حسابات بعد
          </p>
          <Link href="/dashboard/accounts/new">
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء أول حساب
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <div className="space-y-6">
              {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
                <div key={type}>
                  <h2 className="text-lg font-semibold mb-3">
                    {type === "ASSET" && "الأصول"}
                    {type === "LIABILITY" && "الخصوم"}
                    {type === "EQUITY" && "حقوق الملكية"}
                    {type === "REVENUE" && "الإيرادات"}
                    {type === "EXPENSE" && "المصروفات"}
                    <span className="text-sm font-normal text-muted-foreground mr-2">
                      ({typeAccounts.length} حساب)
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeAccounts.map((account) => (
                      <AccountCard key={account.id} account={account} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Tree View
            <AccountTreeView accounts={accounts} />
          )}
        </>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Link
            href={`?page=${Math.max(1, currentPage - 1)}`}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
            }`}
          >
            السابق
          </Link>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Link
                  key={pageNum}
                  href={`?page=${pageNum}`}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === pageNum
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            })}
          </div>

          <Link
            href={`?page=${Math.min(totalPages, currentPage + 1)}`}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
            }`}
          >
            التالي
          </Link>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <Link
        href="/dashboard/accounts/new"
        className="fixed bottom-20 left-4 z-40 sm:hidden"
      >
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </>
  )
}