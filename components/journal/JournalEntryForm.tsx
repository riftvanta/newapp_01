"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Calculator } from "lucide-react"
import { Account, Currency } from "@prisma/client"
import { AccountSelector } from "./AccountSelector"
import { CurrencyAmountInput } from "./CurrencyAmountInput"
import { format } from "date-fns"

interface JournalLine {
  id: string
  accountId: string
  account?: Account
  debitAmount: number
  creditAmount: number
  currency: Currency
  description: string
}

interface JournalEntryFormProps {
  entry?: any // For edit mode
  mode: "create" | "edit"
}

export function JournalEntryForm({ entry, mode }: JournalEntryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number>(0.71)

  const [formData, setFormData] = useState({
    date: entry?.date ? format(new Date(entry.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    description: entry?.description || "",
    reference: entry?.reference || ""
  })

  const [lines, setLines] = useState<JournalLine[]>(
    entry?.lines?.map((line: any) => ({
      id: Math.random().toString(),
      accountId: line.accountId,
      account: line.account,
      debitAmount: parseFloat(line.debitAmount || 0),
      creditAmount: parseFloat(line.creditAmount || 0),
      currency: line.currency,
      description: line.description || ""
    })) || [
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
  )

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
    setLines(lines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isBalanced) {
      alert("القيد غير متوازن. يجب أن تتساوى المبالغ المدينة والدائنة لكل عملة")
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
          lines: lines.map(line => ({
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
    <Card>
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

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b text-sm">
                    <th className="text-right pb-2">الحساب</th>
                    <th className="text-right pb-2">مدين</th>
                    <th className="text-right pb-2">دائن</th>
                    <th className="text-right pb-2">العملة</th>
                    <th className="text-right pb-2">الوصف</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {lines.map((line, index) => (
                    <tr key={line.id} className="border-b">
                      <td className="py-2 pl-2">
                        <AccountSelector
                          value={line.accountId}
                          onChange={(accountId, account) => {
                            handleLineChange(line.id, "accountId", accountId)
                            handleLineChange(line.id, "account", account)
                            if (account) {
                              handleLineChange(line.id, "currency", account.currency)
                            }
                          }}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <CurrencyAmountInput
                          value={line.debitAmount}
                          onChange={(value) => {
                            handleLineChange(line.id, "debitAmount", value)
                            if (value > 0) {
                              handleLineChange(line.id, "creditAmount", 0)
                            }
                          }}
                          currency={line.currency}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <CurrencyAmountInput
                          value={line.creditAmount}
                          onChange={(value) => {
                            handleLineChange(line.id, "creditAmount", value)
                            if (value > 0) {
                              handleLineChange(line.id, "debitAmount", 0)
                            }
                          }}
                          currency={line.currency}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <div className="text-sm font-medium">
                          {line.currency}
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={line.description}
                          onChange={(e) => handleLineChange(line.id, "description", e.target.value)}
                          placeholder="وصف اختياري"
                          className="h-8"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        {lines.length > 2 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveLine(line.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className="pt-3">المجموع</td>
                    <td className="pt-3 px-2">
                      {totals.debitsJOD > 0 && (
                        <div className="text-sm">{totals.debitsJOD.toFixed(2)} JOD</div>
                      )}
                      {totals.debitsUSDT > 0 && (
                        <div className="text-sm">{totals.debitsUSDT.toFixed(2)} USDT</div>
                      )}
                    </td>
                    <td className="pt-3 px-2">
                      {totals.creditsJOD > 0 && (
                        <div className="text-sm">{totals.creditsJOD.toFixed(2)} JOD</div>
                      )}
                      {totals.creditsUSDT > 0 && (
                        <div className="text-sm">{totals.creditsUSDT.toFixed(2)} USDT</div>
                      )}
                    </td>
                    <td colSpan={3} className="pt-3 px-2">
                      {!isBalanced && (
                        <span className="text-red-500 text-sm">القيد غير متوازن</span>
                      )}
                      {isBalanced && (
                        <span className="text-green-500 text-sm">القيد متوازن ✓</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
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