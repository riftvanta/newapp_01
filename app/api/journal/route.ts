import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createJournalEntry, getJournalEntries } from "@/lib/journal"
import { revalidatePath } from "next/cache"

// GET /api/journal - List journal entries
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const accountId = searchParams.get("accountId")
    const status = searchParams.get("status") as "POSTED" | "VOIDED" | undefined

    const result = await getJournalEntries({
      skip: (page - 1) * limit,
      take: limit,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      accountId: accountId || undefined,
      status
    })

    return NextResponse.json({
      entries: result.entries,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit)
    })
  } catch (error) {
    console.error("Error fetching journal entries:", error)
    return NextResponse.json(
      { error: "حدث خطأ في جلب القيود" },
      { status: 500 }
    )
  }
}

// POST /api/journal - Create new journal entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { date, description, reference, lines } = body

    // Validate required fields
    if (!description || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: "البيانات المطلوبة غير مكتملة" },
        { status: 400 }
      )
    }

    // Validate that each line has required fields
    for (const line of lines) {
      if (!line.accountId || !line.currency) {
        return NextResponse.json(
          { error: "كل سطر يجب أن يحتوي على حساب وعملة" },
          { status: 400 }
        )
      }

      // Ensure amounts are numbers
      line.debitAmount = parseFloat(line.debitAmount || 0)
      line.creditAmount = parseFloat(line.creditAmount || 0)

      // Validate that line has either debit or credit, not both
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        return NextResponse.json(
          { error: "السطر يجب أن يكون إما مدين أو دائن، ليس كلاهما" },
          { status: 400 }
        )
      }

      if (line.debitAmount === 0 && line.creditAmount === 0) {
        return NextResponse.json(
          { error: "السطر يجب أن يحتوي على مبلغ مدين أو دائن" },
          { status: 400 }
        )
      }
    }

    // Create the journal entry
    const journalEntry = await createJournalEntry({
      date: date ? new Date(date) : new Date(),
      description,
      reference,
      lines,
      createdBy: session.user?.name || "admin"
    })

    // Revalidate relevant pages
    revalidatePath("/dashboard/journal")
    revalidatePath("/dashboard/accounts")

    return NextResponse.json(journalEntry, { status: 201 })
  } catch (error: any) {
    console.error("Error creating journal entry:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ في إنشاء القيد" },
      { status: 400 }
    )
  }
}