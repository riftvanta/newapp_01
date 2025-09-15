"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface ExchangeRateFormProps {
  currentRate: number
}

export function ExchangeRateForm({ currentRate }: ExchangeRateFormProps) {
  const router = useRouter()
  const [rate, setRate] = useState(currentRate.toString())
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/settings/exchange-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: parseFloat(rate) }),
      })

      if (response.ok) {
        router.refresh()
        alert("تم تحديث سعر الصرف بنجاح")
      } else {
        const error = await response.json()
        alert(error.error || "حدث خطأ في تحديث سعر الصرف")
      }
    } catch (error) {
      console.error("Error updating exchange rate:", error)
      alert("حدث خطأ في تحديث سعر الصرف")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="rate">سعر الصرف (1 USDT = ? JOD)</Label>
        <Input
          id="rate"
          type="number"
          step="0.0001"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
          min="0.0001"
          placeholder="0.71"
        />
        <p className="text-sm text-muted-foreground mt-1">
          1 USDT = {rate} JOD
        </p>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>
    </form>
  )
}