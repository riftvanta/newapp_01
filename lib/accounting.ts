import { AccountType, BalanceType, Currency } from "@prisma/client"

export function getNormalBalance(accountType: AccountType): BalanceType {
  switch (accountType) {
    case "ASSET":
    case "EXPENSE":
      return "DEBIT"
    case "LIABILITY":
    case "EQUITY":
    case "REVENUE":
      return "CREDIT"
    default:
      return "DEBIT"
  }
}

export function getAccountTypeRange(accountType: AccountType): { min: number; max: number } {
  switch (accountType) {
    case "ASSET":
      return { min: 1000, max: 1999 }
    case "LIABILITY":
      return { min: 2000, max: 2999 }
    case "EQUITY":
      return { min: 3000, max: 3999 }
    case "REVENUE":
      return { min: 4000, max: 4999 }
    case "EXPENSE":
      return { min: 5000, max: 5999 }
    default:
      return { min: 1000, max: 1999 }
  }
}

export function calculateBalance(
  debits: number,
  credits: number,
  normalBalance: BalanceType
): number {
  if (normalBalance === "DEBIT") {
    return debits - credits
  } else {
    return credits - debits
  }
}

export function formatBalance(
  balance: number,
  normalBalance: BalanceType,
  currency: Currency
): {
  amount: string
  isNegative: boolean
  formattedAmount: string
} {
  const isNegative = balance < 0
  const absBalance = Math.abs(balance)
  const currencySymbol = currency === "JOD" ? "د.أ" : "USDT"

  const amount = absBalance.toFixed(2)
  const formattedAmount = isNegative
    ? `(${amount} ${currencySymbol})`
    : `${amount} ${currencySymbol}`

  return {
    amount,
    isNegative,
    formattedAmount
  }
}

export function getAccountTypeName(accountType: AccountType): string {
  switch (accountType) {
    case "ASSET":
      return "الأصول"
    case "LIABILITY":
      return "الخصوم"
    case "EQUITY":
      return "حقوق الملكية"
    case "REVENUE":
      return "الإيرادات"
    case "EXPENSE":
      return "المصروفات"
    default:
      return ""
  }
}

export function getBalanceTypeName(balanceType: BalanceType): string {
  return balanceType === "DEBIT" ? "مدين" : "دائن"
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  if (fromCurrency === "USDT" && toCurrency === "JOD") {
    return amount * exchangeRate
  } else if (fromCurrency === "JOD" && toCurrency === "USDT") {
    return amount / exchangeRate
  }

  return amount
}