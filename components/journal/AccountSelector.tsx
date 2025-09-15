"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Account } from "@prisma/client"
import { getAccountTypeName } from "@/lib/accounting"
import { Search } from "lucide-react"

interface AccountSelectorProps {
  value: string
  onChange: (accountId: string, account?: Account) => void
}

export function AccountSelector({ value, onChange }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = accounts.filter(account =>
        account.nameAr.includes(searchTerm) ||
        account.code.includes(searchTerm)
      )
      setFilteredAccounts(filtered)
    } else {
      setFilteredAccounts(accounts)
    }
  }, [searchTerm, accounts])

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts")
      const data = await response.json()
      // Filter out parent accounts as they can't have transactions
      const childAccounts = data.filter((acc: Account) => !acc.isParent)
      setAccounts(childAccounts)
      setFilteredAccounts(childAccounts)
    } catch (error) {
      console.error("Error fetching accounts:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedAccount = accounts.find(acc => acc.id === value)

  // Group accounts by type for better organization
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.accountType
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(account)
    return groups
  }, {} as Record<string, Account[]>)

  return (
    <div className="relative w-full">
      <Select
        value={value || "none"}
        onValueChange={(val) => {
          if (val === "none") {
            onChange("", undefined)
          } else {
            const account = accounts.find(acc => acc.id === val)
            onChange(val, account)
          }
        }}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full text-sm">
          <SelectValue>
            {selectedAccount
              ? `${selectedAccount.code} - ${selectedAccount.nameAr}`
              : "اختر حساب"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {/* Search input */}
          <div className="sticky top-0 bg-background p-2 border-b">
            <div className="relative">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الرقم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8 h-9"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {loading && (
            <div className="p-2 text-center text-sm text-muted-foreground">
              جاري التحميل...
            </div>
          )}

          {!loading && filteredAccounts.length === 0 && (
            <div className="p-2 text-center text-sm text-muted-foreground">
              لا توجد حسابات
            </div>
          )}

          {!loading && filteredAccounts.length > 0 && (
            <>
              <SelectItem value="none">-- بدون حساب --</SelectItem>
              {Object.entries(groupedAccounts).map(([type, accounts]) => (
                <div key={type}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {getAccountTypeName(type as any)}
                  </div>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                      className="pr-8"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{account.code} - {account.nameAr}</span>
                        <span className="text-xs text-muted-foreground mr-2">
                          {account.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}