"use client"

import { Account } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { formatBalance, getAccountTypeName, getBalanceTypeName } from "@/lib/accounting"
import { ChevronLeft, Edit, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AccountCardProps {
  account: Account & {
    parent?: Account | null
    children?: Account[]
  }
}

export function AccountCard({ account }: AccountCardProps) {
  const { formattedAmount, isNegative } = formatBalance(
    Number(account.currentBalance),
    account.normalBalance,
    account.currency
  )

  const hasChildren = account.children && account.children.length > 0

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-muted-foreground">
              {account.code}
            </span>
            {account.isParent && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                رئيسي
              </span>
            )}
          </div>
          <h3 className="font-semibold text-lg">{account.nameAr}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>{getAccountTypeName(account.accountType)}</span>
            <span>•</span>
            <span>{getBalanceTypeName(account.normalBalance)}</span>
            {account.parent && (
              <>
                <span>•</span>
                <span>{account.parent.nameAr}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-left">
          <div className={`text-lg font-bold ${isNegative ? "text-red-600" : ""}`}>
            {formattedAmount}
          </div>
          {hasChildren && (
            <div className="text-xs text-muted-foreground mt-1">
              {account.children?.length || 0} حساب فرعي
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Link href={`/dashboard/accounts/${account.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 ml-2" />
            عرض
          </Button>
        </Link>
        {!account.hasTransactions && (
          <Link href={`/dashboard/accounts/${account.id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-4 w-4 ml-2" />
              تعديل
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}