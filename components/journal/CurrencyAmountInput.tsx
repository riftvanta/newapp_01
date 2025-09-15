"use client"

import { Input } from "@/components/ui/input"
import { Currency } from "@prisma/client"

interface CurrencyAmountInputProps {
  value: number
  onChange: (value: number) => void
  currency: Currency
  disabled?: boolean
}

export function CurrencyAmountInput({
  value,
  onChange,
  currency,
  disabled = false
}: CurrencyAmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    onChange(val)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus for easy editing
    e.target.select()
  }

  return (
    <div className="relative">
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value || ""}
        onChange={handleChange}
        onFocus={handleFocus}
        disabled={disabled}
        className="pr-12 h-8 text-sm"
        placeholder="0.00"
      />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {currency}
      </span>
    </div>
  )
}