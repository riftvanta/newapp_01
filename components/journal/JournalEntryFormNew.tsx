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
import { Loader2, Plus, Trash2, Calculator } from "lucide-react"
import { Currency, Account } from "@prisma/client"

interface JournalLine {
  id: string
  accountId: string
  account?: Account
  debitAmount: number
  creditAmount: number
  currency: Currency
  description: string
}

interface JournalEntryFormNewProps {
  entry?: any // For edit mode
  mode: "create" | "edit"
}

export function JournalEntryFormNew({ entry, mode }: JournalEntryFormNewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number>(0.71)
  const [accounts, setAccounts] = useState<Account[]>([])

  const [formData, setFormData] = useState({
    date: entry?.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: entry?.description || "",
    reference: entry?.reference || ""
  })

  const [lines, setLines] = useState<JournalLine[]>(() => {
    if (entry?.lines && entry.lines.length > 0) {
      return entry.lines.map((line: any) => ({
        id: Math.random().toString(),
        accountId: line.accountId || "",
        account: line.account,
        debitAmount: parseFloat(line.debitAmount) || 0,
        creditAmount: parseFloat(line.creditAmount) || 0,
        currency: line.currency || "JOD",
        description: line.description || ""
      }))
    }

    return [
      {
        id: Math.random().toString(),
        accountId: "",
        debitAmount: 0,
        creditAmount: 0,
        currency: "JOD" as Currency,
        description: ""
      },
      {
        id: Math.random().toString(),
        accountId: "",
        debitAmount: 0,
        creditAmount: 0,
        currency: "JOD" as Currency,
        description: ""
      }
    ]
  })

  // Fetch accounts
  useEffect(() => {
    fetch("/api/accounts")
      .then(res => res.json())
      .then(data => {
        // Filter out parent accounts
        const childAccounts = data.filter((acc: Account) => !acc.isParent)
        setAccounts(childAccounts)
      })
      .catch(console.error)
  }, [])

  // Fetch current exchange rate
  useEffect(() => {
    fetch("/api/settings/exchange-rate")
      .then(res => res.json())
      .then(data => {
        if (data.rate) {
          setExchangeRate(parseFloat(data.rate))
        }
      })
      .catch(console.error)
  }, [])

  // Calculate totals
  const totals = lines.reduce((acc, line) => {
    if (line.currency === "JOD") {
      acc.debitsJOD += line.debitAmount
      acc.creditsJOD += line.creditAmount
    } else {
      acc.debitsUSDT += line.debitAmount
      acc.creditsUSDT += line.creditAmount
    }
    return acc
  }, { debitsJOD: 0, creditsJOD: 0, debitsUSDT: 0, creditsUSDT: 0 })

  const isBalanced =
    Math.abs(totals.debitsJOD - totals.creditsJOD) < 0.01 &&
    Math.abs(totals.debitsUSDT - totals.creditsUSDT) < 0.01

  const handleAddLine = () => {
    setLines([...lines, {
      id: Math.random().toString(),
      accountId: "",
      debitAmount: 0,
      creditAmount: 0,
      currency: "JOD" as Currency,
      description: ""
    }])
  }

  const handleRemoveLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id))
    }
  }

  const handleLineChange = (id: string, field: keyof JournalLine, value: any) => {
    setLines(prevLines => prevLines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value }

        // If account changed, update currency
        if (field === "accountId" && value) {
          const account = accounts.find(acc => acc.id === value)
          if (account) {
            updatedLine.currency = account.currency
          }
        }

        return updatedLine
      }
      return line
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isBalanced) {
      alert("القيد غير متوازن. يجب أن تتساوى المبالغ المدينة والدائنة لكل عملة")
      return
    }

    // Validate lines
    const validLines = lines.filter(line => line.accountId && (line.debitAmount > 0 || line.creditAmount > 0))
    if (validLines.length < 2) {
      alert("يجب إدخال سطرين على الأقل")
      return
    }

    setLoading(true)

    try {
      const url = mode === "create"
        ? "/api/journal"
        : `/api/journal/${entry?.id}`

      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lines: validLines.map(line => ({
            accountId: line.accountId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            currency: line.currency,
            description: line.description
          }))
        })
      })

      if (response.ok) {
        router.push("/dashboard/journal")
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || "حدث خطأ")
      }
    } catch (error) {
      console.error("Error submitting journal entry:", error)
      alert("حدث خطأ في حفظ القيد")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "قيد يومية جديد" : "تعديل قيد يومية"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="وصف القيد"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reference">المرجع (اختياري)</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="رقم الفاتورة أو المرجع"
              dir="rtl"
            />
          </div>

          {/* Exchange Rate Notice */}
          {lines.some(l => l.currency === "JOD") && lines.some(l => l.currency === "USDT") && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4" />
                <span>سعر الصرف الحالي: 1 USDT = {exchangeRate} JOD</span>
              </div>
            </div>
          )}

          {/* Journal Lines */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>تفاصيل القيد</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddLine}
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة سطر
              </Button>
            </div>

            {/* Lines for Mobile/Desktop */}
            <div className="space-y-4">
              {lines.map((line, index) => (
                <Card key={line.id} className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Account Selection */}
                    <div className="sm:col-span-4">
                      <Label className="text-xs">الحساب</Label>
                      <Select
                        value={line.accountId}
                        onValueChange={(value) => handleLineChange(line.id, "accountId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حساب" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Debit Amount */}
                    <div className="sm:col-span-2">
                      <Label className="text-xs">مدين</Label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={line.debitAmount > 0 ? line.debitAmount.toString() : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '')
                          if (val === "") {
                            handleLineChange(line.id, "debitAmount", 0)
                          } else {
                            const numVal = parseFloat(val)
                            if (!isNaN(numVal)) {
                              handleLineChange(line.id, "debitAmount", numVal)
                              if (numVal > 0) {
                                handleLineChange(line.id, "creditAmount", 0)
                              }
                            }
                          }
                        }}
                        placeholder="0.00"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    {/* Credit Amount */}
                    <div className="sm:col-span-2">
                      <Label className="text-xs">دائن</Label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={line.creditAmount > 0 ? line.creditAmount.toString() : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '')
                          if (val === "") {
                            handleLineChange(line.id, "creditAmount", 0)
                          } else {
                            const numVal = parseFloat(val)
                            if (!isNaN(numVal)) {
                              handleLineChange(line.id, "creditAmount", numVal)
                              if (numVal > 0) {
                                handleLineChange(line.id, "debitAmount", 0)
                              }
                            }
                          }
                        }}
                        placeholder="0.00"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    {/* Currency Display */}
                    <div className="sm:col-span-1">
                      <Label className="text-xs">العملة</Label>
                      <div className="h-10 flex items-center justify-center bg-muted rounded px-2">
                        <span className="text-sm font-medium">{line.currency}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2">
                      <Label className="text-xs">الوصف</Label>
                      <Input
                        value={line.description}
                        onChange={(e) => handleLineChange(line.id, "description", e.target.value)}
                        placeholder="وصف اختياري"
                        dir="rtl"
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="sm:col-span-1 flex items-end">
                      {lines.length > 2 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveLine(line.id)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Totals */}
            <Card className="p-4 bg-muted/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">مجموع المدين</Label>
                  <div className="space-y-1">
                    {totals.debitsJOD > 0 && (
                      <div className="font-medium">{totals.debitsJOD.toFixed(2)} JOD</div>
                    )}
                    {totals.debitsUSDT > 0 && (
                      <div className="font-medium">{totals.debitsUSDT.toFixed(2)} USDT</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">مجموع الدائن</Label>
                  <div className="space-y-1">
                    {totals.creditsJOD > 0 && (
                      <div className="font-medium">{totals.creditsJOD.toFixed(2)} JOD</div>
                    )}
                    {totals.creditsUSDT > 0 && (
                      <div className="font-medium">{totals.creditsUSDT.toFixed(2)} USDT</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">الحالة</Label>
                  <div className="font-medium">
                    {!isBalanced && (
                      <span className="text-red-500">القيد غير متوازن ❌</span>
                    )}
                    {isBalanced && (
                      <span className="text-green-500">القيد متوازن ✓</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !isBalanced}
              className="flex-1"
            >
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "إنشاء القيد" : "حفظ التغييرات"}
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