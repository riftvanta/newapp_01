"use client"

import { useState, useEffect } from "react"
import { AccountCard } from "@/components/accounts/account-card"
import { AccountTreeView } from "@/components/accounts/account-tree-view"
import { Button } from "@/components/ui/button"
import { Plus, Grid3x3, TreePine } from "lucide-react"
import Link from "next/link"
import { getViewMode, saveViewMode } from "@/lib/account-tree-utils"
import type { Account } from "@prisma/client"

interface AccountsClientProps {
  accounts: (Account & {
    parent?: Account | null
    children?: Account[]
  })[]
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid')

  // Load view mode from localStorage
  useEffect(() => {
    const savedMode = getViewMode()
    setViewMode(savedMode)
  }, [])

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">دليل الحسابات</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 px-2 sm:px-3"
              aria-label="عرض شبكي"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="hidden sm:inline mr-2">شبكة</span>
            </Button>
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('tree')}
              className="h-8 px-2 sm:px-3"
              aria-label="عرض شجري"
            >
              <TreePine className="h-4 w-4" />
              <span className="hidden sm:inline mr-2">شجرة</span>
            </Button>
          </div>

          {/* New Account Button */}
          <Link href="/dashboard/accounts/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-8 sm:h-10">
              <Plus className="h-4 w-4 ml-2" />
              حساب جديد
            </Button>
          </Link>
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