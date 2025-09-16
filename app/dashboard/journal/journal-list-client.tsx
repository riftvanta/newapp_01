"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, FileText, Filter } from "lucide-react"

interface JournalListClientProps {
  initialEntries: any[]
  initialTotal: number
}

export function JournalListClient({ initialEntries, initialTotal }: JournalListClientProps) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "POSTED" | "VOIDED">("POSTED")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const fetchEntries = async (resetPage = false) => {
    setLoading(true)
    const currentPage = resetPage ? 1 : page

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20"
      })

      if (statusFilter !== "ALL") {
        params.append("status", statusFilter)
      }

      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)

      const response = await fetch(`/api/journal?${params}`)
      const data = await response.json()

      if (resetPage) {
        setEntries(data.entries)
        setPage(1)
      } else {
        setEntries(prev => [...prev, ...data.entries])
      }
      setTotal(data.total)
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, entryNumber: number) => {
    if (!confirm(`هل أنت متأكد من حذف القيد رقم ${entryNumber}؟ سيتم إلغاء جميع تأثيراته على الحسابات.`)) {
      return
    }

    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchEntries(true)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || "حدث خطأ في حذف القيد")
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      alert("حدث خطأ في حذف القيد")
    }
  }

  const handleRefresh = async () => {
    await fetchEntries(true)
    router.refresh()
  }

  const formatCurrency = (amount: any, currency: string) => {
    // Convert Decimal object to number if needed
    const numAmount = typeof amount === 'object' ? parseFloat(amount.toString()) : parseFloat(amount)
    return `${numAmount.toFixed(2)} ${currency}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">قيود اليومية</h1>
          <Link href="/dashboard/journal/new">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              قيد جديد
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">من تاريخ</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">إلى تاريخ</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الحالة</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: any) => setStatusFilter(value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">الكل</SelectItem>
                    <SelectItem value="POSTED">مرحل</SelectItem>
                    <SelectItem value="VOIDED">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => fetchEntries(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Filter className="ml-2 h-4 w-4" />
                  تطبيق
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className={entry.status === "VOIDED" ? "opacity-60" : ""}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">قيد #{entry.entryNumber}</span>
                      {entry.status === "VOIDED" && (
                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded">
                          ملغي
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                    <p className="font-medium">{entry.description}</p>
                    {entry.reference && (
                      <p className="text-sm text-muted-foreground">
                        المرجع: {entry.reference}
                      </p>
                    )}

                    {/* Entry Lines Summary */}
                    <div className="mt-3 space-y-1">
                      {entry.lines?.slice(0, 3).map((line: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          {line.account.nameAr} -
                          {line.debitAmount > 0 && ` مدين ${formatCurrency(line.debitAmount, line.currency)}`}
                          {line.creditAmount > 0 && ` دائن ${formatCurrency(line.creditAmount, line.currency)}`}
                        </div>
                      ))}
                      {entry.lines?.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          ... و {entry.lines.length - 3} سطور أخرى
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-sm">
                      {entry.totalDebitsJOD > 0 && (
                        <div>
                          <span className="text-muted-foreground">JOD:</span>
                          <span className="font-medium mr-1">
                            {formatCurrency(entry.totalDebitsJOD, "د.أ")}
                          </span>
                        </div>
                      )}
                      {entry.totalDebitsUSDT > 0 && (
                        <div>
                          <span className="text-muted-foreground">USDT:</span>
                          <span className="font-medium mr-1">
                            {formatCurrency(entry.totalDebitsUSDT, "$")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2">
                    <Link href={`/dashboard/journal/${entry.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4" />
                        <span className="mr-1">تعديل</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(entry.id, entry.entryNumber)}
                      disabled={entry.status === "VOIDED"}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="mr-1">حذف</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {entries.length < total && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => {
                setPage(p => p + 1)
                fetchEntries()
              }}
              disabled={loading}
              variant="outline"
            >
              {loading ? "جاري التحميل..." : "عرض المزيد"}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {entries.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد قيود يومية</p>
              <Link href="/dashboard/journal/new">
                <Button className="mt-4">
                  <Plus className="ml-2 h-4 w-4" />
                  إنشاء أول قيد
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
  )
}