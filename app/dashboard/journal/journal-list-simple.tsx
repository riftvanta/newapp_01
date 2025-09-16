"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, FileText } from "lucide-react"

interface JournalListSimpleProps {
  initialEntries: any[]
  initialTotal: number
}

export function JournalListSimple({ initialEntries, initialTotal }: JournalListSimpleProps) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)

  const handleDelete = async (id: string, entryNumber: number) => {
    if (!confirm(`هل أنت متأكد من حذف القيد رقم ${entryNumber}؟`)) {
      return
    }

    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        // Remove from local state
        setEntries(entries.filter(e => e.id !== id))
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

  const formatDate = (date: string) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  const formatCurrency = (amount: any, currency: string) => {
    // Convert Decimal object to number if needed
    const numAmount = typeof amount === 'object' ? parseFloat(amount.toString()) : parseFloat(amount)
    return `${numAmount.toFixed(2)} ${currency === "JOD" ? "د.أ" : "USDT"}`
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

      {/* Entries List */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className={entry.status === "VOIDED" ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  {/* Entry Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">قيد #{entry.entryNumber}</span>
                    {entry.status === "VOIDED" && (
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded">
                        ملغي
                      </span>
                    )}
                  </div>

                  {/* Date and Description */}
                  <p className="text-sm text-muted-foreground mb-1">
                    {formatDate(entry.date)}
                  </p>
                  <p className="font-medium">{entry.description}</p>
                  {entry.reference && (
                    <p className="text-sm text-muted-foreground">
                      المرجع: {entry.reference}
                    </p>
                  )}

                  {/* Totals */}
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-sm">
                    {entry.totalDebitsJOD > 0 && (
                      <div>
                        <span className="text-muted-foreground">JOD:</span>
                        <span className="font-medium mr-1">
                          {formatCurrency(entry.totalDebitsJOD, "JOD")}
                        </span>
                      </div>
                    )}
                    {entry.totalDebitsUSDT > 0 && (
                      <div>
                        <span className="text-muted-foreground">USDT:</span>
                        <span className="font-medium mr-1">
                          {formatCurrency(entry.totalDebitsUSDT, "USDT")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2">
                  <Link href={`/dashboard/journal/${entry.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry.id, entry.entryNumber)}
                    disabled={entry.status === "VOIDED"}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {entries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد قيود يومية</p>
            <Link href="/dashboard/journal/new">
              <Button>
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