import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const getAccounts = unstable_cache(
  async (accountType?: string, parentOnly?: boolean) => {
    const where: any = {}
    if (accountType && accountType !== "ALL") {
      where.accountType = accountType
    }
    if (parentOnly) {
      where.isParent = true
    }

    return prisma.account.findMany({
      where,
      include: {
        parent: true,
        children: true
      },
      orderBy: [
        { accountType: "asc" },
        { code: "asc" }
      ]
    })
  },
  ['accounts'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['accounts']
  }
)

export const getAccountById = unstable_cache(
  async (id: string) => {
    return prisma.account.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { code: "asc" }
        }
      }
    })
  },
  ['account-detail'],
  {
    revalidate: 60,
    tags: ['accounts']
  }
)

export const getExchangeRate = unstable_cache(
  async () => {
    let exchangeRate = await prisma.exchangeRate.findFirst()

    if (!exchangeRate) {
      exchangeRate = await prisma.exchangeRate.create({
        data: {
          rate: 0.71,
          updatedBy: "system"
        }
      })
    }

    return exchangeRate
  },
  ['exchange-rate'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['exchange-rate']
  }
)