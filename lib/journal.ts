import { prisma } from "@/lib/prisma"
import { Currency, BalanceType, JournalStatus } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

interface JournalEntryLineInput {
  accountId: string
  debitAmount: number
  creditAmount: number
  currency: Currency
  description?: string
}

interface CreateJournalEntryInput {
  date: Date
  description: string
  reference?: string
  lines: JournalEntryLineInput[]
  createdBy: string
}

// Get current exchange rate from settings
export async function getCurrentExchangeRate(): Promise<number> {
  const rate = await prisma.exchangeRate.findFirst({
    orderBy: { updatedAt: "desc" }
  })
  return rate ? rate.rate.toNumber() : 0.71 // Default to 0.71 if not set
}

// Convert amount between currencies
export function convertAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount

  if (fromCurrency === "USDT" && toCurrency === "JOD") {
    return amount * exchangeRate
  } else if (fromCurrency === "JOD" && toCurrency === "USDT") {
    return amount / exchangeRate
  }

  return amount
}

// Validate journal entry (debits must equal credits)
export function validateJournalEntry(lines: JournalEntryLineInput[]): {
  isValid: boolean
  totalDebitsJOD: number
  totalCreditsJOD: number
  totalDebitsUSDT: number
  totalCreditsUSDT: number
  error?: string
} {
  let totalDebitsJOD = 0
  let totalCreditsJOD = 0
  let totalDebitsUSDT = 0
  let totalCreditsUSDT = 0

  for (const line of lines) {
    if (line.currency === "JOD") {
      totalDebitsJOD += line.debitAmount
      totalCreditsJOD += line.creditAmount
    } else {
      totalDebitsUSDT += line.debitAmount
      totalCreditsUSDT += line.creditAmount
    }
  }

  // Round to 2 decimal places to avoid floating point issues
  totalDebitsJOD = Math.round(totalDebitsJOD * 100) / 100
  totalCreditsJOD = Math.round(totalCreditsJOD * 100) / 100
  totalDebitsUSDT = Math.round(totalDebitsUSDT * 100) / 100
  totalCreditsUSDT = Math.round(totalCreditsUSDT * 100) / 100

  const isValidJOD = totalDebitsJOD === totalCreditsJOD
  const isValidUSDT = totalDebitsUSDT === totalCreditsUSDT

  return {
    isValid: isValidJOD && isValidUSDT,
    totalDebitsJOD,
    totalCreditsJOD,
    totalDebitsUSDT,
    totalCreditsUSDT,
    error: !isValidJOD ? `JOD imbalance: Debits ${totalDebitsJOD} ≠ Credits ${totalCreditsJOD}` :
           !isValidUSDT ? `USDT imbalance: Debits ${totalDebitsUSDT} ≠ Credits ${totalCreditsUSDT}` :
           undefined
  }
}

// Create and post journal entry
export async function createJournalEntry(input: CreateJournalEntryInput) {
  // Validate the entry
  const validation = validateJournalEntry(input.lines)
  if (!validation.isValid) {
    throw new Error(validation.error || "Journal entry is not balanced")
  }

  // Get current exchange rate
  const exchangeRate = await getCurrentExchangeRate()

  // Start transaction
  return await prisma.$transaction(async (tx) => {
    // Get the next entry number
    const lastEntry = await tx.journalEntry.findFirst({
      orderBy: { entryNumber: "desc" }
    })
    const nextEntryNumber = (lastEntry?.entryNumber || 0) + 1

    // Create the journal entry
    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNumber: nextEntryNumber,
        date: input.date,
        description: input.description,
        reference: input.reference,
        status: "POSTED",
        totalDebitsJOD: validation.totalDebitsJOD,
        totalCreditsJOD: validation.totalCreditsJOD,
        totalDebitsUSDT: validation.totalDebitsUSDT,
        totalCreditsUSDT: validation.totalCreditsUSDT,
        createdBy: input.createdBy,
        lines: {
          create: input.lines.map(line => ({
            accountId: line.accountId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            currency: line.currency,
            exchangeRate: exchangeRate,
            convertedAmountJOD: line.currency === "JOD"
              ? (line.debitAmount || line.creditAmount)
              : convertAmount(
                  line.debitAmount || line.creditAmount,
                  "USDT",
                  "JOD",
                  exchangeRate
                ),
            description: line.description
          }))
        }
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    })

    // Post transactions and update balances
    await postTransactions(tx, journalEntry.id, journalEntry.date, input.lines, exchangeRate)

    return journalEntry
  })
}

// Post transactions and update account balances
async function postTransactions(
  tx: any,
  journalEntryId: string,
  date: Date,
  lines: JournalEntryLineInput[],
  exchangeRate: number
) {
  for (const line of lines) {
    const account = await tx.account.findUnique({
      where: { id: line.accountId }
    })

    if (!account) {
      throw new Error(`Account not found: ${line.accountId}`)
    }

    // Calculate the net effect on the account
    let amount = 0
    let transactionType: BalanceType

    if (line.debitAmount > 0) {
      amount = line.debitAmount
      transactionType = "DEBIT"
    } else if (line.creditAmount > 0) {
      amount = line.creditAmount
      transactionType = "CREDIT"
    } else {
      continue // Skip if no amount
    }

    // Calculate new balance
    const currentBalance = account.currentBalance.toNumber()
    let newBalance = currentBalance

    // Apply the transaction based on normal balance
    if (account.normalBalance === "DEBIT") {
      newBalance = transactionType === "DEBIT"
        ? currentBalance + amount
        : currentBalance - amount
    } else {
      newBalance = transactionType === "CREDIT"
        ? currentBalance + amount
        : currentBalance - amount
    }

    // Create transaction record
    await tx.transaction.create({
      data: {
        journalEntryId,
        accountId: line.accountId,
        date,
        amount,
        type: transactionType,
        currency: line.currency,
        exchangeRate,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: line.description
      }
    })

    // Update account balance and mark as having transactions
    await tx.account.update({
      where: { id: line.accountId },
      data: {
        currentBalance: newBalance,
        hasTransactions: true
      }
    })

    // Update parent account balances recursively
    if (account.parentId) {
      await updateParentBalance(tx, account.parentId)
    }
  }
}

// Update parent account balance
async function updateParentBalance(tx: any, parentId: string) {
  const parent = await tx.account.findUnique({
    where: { id: parentId },
    include: { children: true }
  })

  if (!parent || !parent.isParent) return

  // Calculate sum of children balances
  const totalBalance = parent.children.reduce((sum: number, child: any) => {
    return sum + child.currentBalance.toNumber()
  }, 0)

  await tx.account.update({
    where: { id: parentId },
    data: { currentBalance: totalBalance }
  })

  // Recursively update grandparent if exists
  if (parent.parentId) {
    await updateParentBalance(tx, parent.parentId)
  }
}

// Edit a posted journal entry
export async function editJournalEntry(
  journalEntryId: string,
  input: CreateJournalEntryInput
) {
  // Validate the new entry
  const validation = validateJournalEntry(input.lines)
  if (!validation.isValid) {
    throw new Error(validation.error || "Journal entry is not balanced")
  }

  // Get current exchange rate
  const exchangeRate = await getCurrentExchangeRate()

  return await prisma.$transaction(async (tx) => {
    // First, reverse the original entry
    await reverseJournalEntry(tx, journalEntryId)

    // Update the journal entry
    const updatedEntry = await tx.journalEntry.update({
      where: { id: journalEntryId },
      data: {
        date: input.date,
        description: input.description,
        reference: input.reference,
        totalDebitsJOD: validation.totalDebitsJOD,
        totalCreditsJOD: validation.totalCreditsJOD,
        totalDebitsUSDT: validation.totalDebitsUSDT,
        totalCreditsUSDT: validation.totalCreditsUSDT,
        updatedAt: new Date()
      }
    })

    // Delete old lines
    await tx.journalEntryLine.deleteMany({
      where: { journalEntryId }
    })

    // Create new lines
    await tx.journalEntryLine.createMany({
      data: input.lines.map(line => ({
        journalEntryId,
        accountId: line.accountId,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        currency: line.currency,
        exchangeRate: exchangeRate,
        convertedAmountJOD: line.currency === "JOD"
          ? (line.debitAmount || line.creditAmount)
          : convertAmount(
              line.debitAmount || line.creditAmount,
              "USDT",
              "JOD",
              exchangeRate
            ),
        description: line.description
      }))
    })

    // Post new transactions
    await postTransactions(tx, journalEntryId, input.date, input.lines, exchangeRate)

    return updatedEntry
  })
}

// Delete a journal entry and reverse all its effects
export async function deleteJournalEntry(journalEntryId: string) {
  return await prisma.$transaction(async (tx) => {
    // Get the entry to ensure it exists
    const entry = await tx.journalEntry.findUnique({
      where: { id: journalEntryId }
    })

    if (!entry) {
      throw new Error("Journal entry not found")
    }

    if (entry.status === "VOIDED") {
      throw new Error("Journal entry is already voided")
    }

    // Reverse all transactions
    await reverseJournalEntry(tx, journalEntryId)

    // Mark entry as voided instead of deleting (for audit trail)
    await tx.journalEntry.update({
      where: { id: journalEntryId },
      data: {
        status: "VOIDED",
        updatedAt: new Date()
      }
    })

    return { success: true }
  })
}

// Reverse all transactions of a journal entry
async function reverseJournalEntry(tx: any, journalEntryId: string) {
  // Get all transactions for this entry
  const transactions = await tx.transaction.findMany({
    where: { journalEntryId },
    orderBy: { createdAt: "desc" } // Reverse in opposite order
  })

  // Reverse each transaction
  for (const transaction of transactions) {
    const account = await tx.account.findUnique({
      where: { id: transaction.accountId }
    })

    if (!account) continue

    // Calculate reversed balance
    let reversedBalance = account.currentBalance.toNumber()
    const transactionAmount = transaction.amount.toNumber()

    // Reverse the effect based on normal balance
    if (account.normalBalance === "DEBIT") {
      reversedBalance = transaction.type === "DEBIT"
        ? reversedBalance - transactionAmount
        : reversedBalance + transactionAmount
    } else {
      reversedBalance = transaction.type === "CREDIT"
        ? reversedBalance - transactionAmount
        : reversedBalance + transactionAmount
    }

    // Update account balance
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { currentBalance: reversedBalance }
    })

    // Update parent balances
    if (account.parentId) {
      await updateParentBalance(tx, account.parentId)
    }
  }

  // Delete all transactions for this entry
  await tx.transaction.deleteMany({
    where: { journalEntryId }
  })
}

// Get journal entries with filters
export async function getJournalEntries(options: {
  skip?: number
  take?: number
  dateFrom?: Date
  dateTo?: Date
  accountId?: string
  status?: JournalStatus
}) {
  const where: any = {}

  if (options.dateFrom || options.dateTo) {
    where.date = {}
    if (options.dateFrom) where.date.gte = options.dateFrom
    if (options.dateTo) where.date.lte = options.dateTo
  }

  if (options.accountId) {
    where.lines = {
      some: { accountId: options.accountId }
    }
  }

  if (options.status) {
    where.status = options.status
  }

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      skip: options.skip || 0,
      take: options.take || 20,
      orderBy: [
        { date: "desc" },
        { entryNumber: "desc" }
      ],
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    }),
    prisma.journalEntry.count({ where })
  ])

  return { entries, total }
}

// Get single journal entry with details
export async function getJournalEntry(id: string) {
  return await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      lines: {
        include: {
          account: true
        }
      },
      transactions: {
        include: {
          account: true
        },
        orderBy: { createdAt: "asc" }
      }
    }
  })
}