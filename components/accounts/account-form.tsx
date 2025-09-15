"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Account, AccountType, BalanceType, Currency } from "@prisma/client"
import { getNormalBalance, getAccountTypeName, getBalanceTypeName } from "@/lib/accounting"
import { Loader2 } from "lucide-react"

interface AccountFormProps {
  account?: Account
  mode: "create" | "edit"
}

export function AccountForm({ account, mode }: AccountFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parentAccounts, setParentAccounts] = useState<Account[]>([])

  const [formData, setFormData] = useState({
    nameAr: account?.nameAr || "",
    accountType: account?.accountType || "ASSET" as AccountType,
    parentId: account?.parentId || "",
    isParent: account?.isParent || false,
    currency: account?.currency || "JOD" as Currency,
    openingBalance: account?.openingBalance?.toString() || "0",
    openingBalanceType: account?.openingBalanceType || "DEBIT" as BalanceType,
  })

  const [normalBalance, setNormalBalance] = useState<BalanceType>(
    getNormalBalance(formData.accountType)
  )

  useEffect(() => {
    fetchParentAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountType])

  useEffect(() => {
    setNormalBalance(getNormalBalance(formData.accountType))
    setFormData(prev => ({
      ...prev,
      openingBalanceType: getNormalBalance(formData.accountType)
    }))
  }, [formData.accountType])

  const fetchParentAccounts = async () => {
    try {
      const response = await fetch(
        `/api/accounts?type=${formData.accountType}&parentOnly=true`
      )
      const data = await response.json()
      setParentAccounts(data)
    } catch (error) {
      console.error("Error fetching parent accounts:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = mode === "create"
        ? "/api/accounts"
        : `/api/accounts/${account?.id}`

      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          openingBalance: parseFloat(formData.openingBalance),
          parentId: formData.parentId || null,
        }),
      })

      if (response.ok) {
        router.push("/dashboard/accounts")
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || "حدث خطأ")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("حدث خطأ في حفظ الحساب")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "إنشاء حساب جديد" : "تعديل الحساب"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nameAr">اسم الحساب (بالعربية)</Label>
            <Input
              id="nameAr"
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
              dir="rtl"
              placeholder="مثال: النقدية في الصندوق"
            />
          </div>

          <div>
            <Label htmlFor="accountType">نوع الحساب</Label>
            <Select
              value={formData.accountType}
              onValueChange={(value: AccountType) =>
                setFormData({ ...formData, accountType: value })
              }
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSET">الأصول</SelectItem>
                <SelectItem value="LIABILITY">الخصوم</SelectItem>
                <SelectItem value="EQUITY">حقوق الملكية</SelectItem>
                <SelectItem value="REVENUE">الإيرادات</SelectItem>
                <SelectItem value="EXPENSE">المصروفات</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              الرصيد الطبيعي: {getBalanceTypeName(normalBalance)}
            </p>
          </div>

          {mode === "create" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isParent"
                checked={formData.isParent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isParent: checked as boolean })
                }
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor="isParent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                حساب رئيسي
              </Label>
            </div>
          )}

          {!formData.isParent && parentAccounts.length > 0 && (
            <div>
              <Label htmlFor="parentId">الحساب الرئيسي (اختياري)</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب الرئيسي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون حساب رئيسي</SelectItem>
                  {parentAccounts.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.code} - {parent.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="currency">العملة</Label>
            <Select
              value={formData.currency}
              onValueChange={(value: Currency) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JOD">دينار أردني (JOD)</SelectItem>
                <SelectItem value="USDT">تيثر (USDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!formData.isParent && (
            <>
              <div>
                <Label htmlFor="openingBalance">الرصيد الافتتاحي</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, openingBalance: e.target.value })
                  }
                  disabled={mode === "edit" && account?.hasTransactions}
                />
                {mode === "edit" && account?.hasTransactions && (
                  <p className="text-sm text-muted-foreground mt-1">
                    لا يمكن تغيير الرصيد الافتتاحي لحساب به حركات
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="openingBalanceType">نوع الرصيد الافتتاحي</Label>
                <Select
                  value={formData.openingBalanceType}
                  onValueChange={(value: BalanceType) =>
                    setFormData({ ...formData, openingBalanceType: value })
                  }
                  disabled={mode === "edit" && account?.hasTransactions}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBIT">مدين</SelectItem>
                    <SelectItem value="CREDIT">دائن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "إنشاء الحساب" : "حفظ التغييرات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}