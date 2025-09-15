import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getJournalEntry, editJournalEntry, deleteJournalEntry } from "@/lib/journal"
import { revalidatePath } from "next/cache"

// GET /api/journal/[id] - Get single journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const journalEntry = await getJournalEntry(params.id)

    if (!journalEntry) {
      return NextResponse.json(
        { error: "القيد غير موجود" },
        { status: 404 }
      )
    }

    return NextResponse.json(journalEntry)
  } catch (error) {
    console.error("Error fetching journal entry:", error)
    return NextResponse.json(
      { error: "حدث خطأ في جلب القيد" },
      { status: 500 }
    )
  }
}

// PUT /api/journal/[id] - Edit journal entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate and process lines
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

    // Edit the journal entry
    const updatedEntry = await editJournalEntry(params.id, {
      date: date ? new Date(date) : new Date(),
      description,
      reference,
      lines,
      createdBy: session.user?.name || "admin"
    })

    // Revalidate relevant pages
    revalidatePath("/dashboard/journal")
    revalidatePath("/dashboard/accounts")
    revalidatePath(`/dashboard/journal/${params.id}`)

    return NextResponse.json(updatedEntry)
  } catch (error: any) {
    console.error("Error editing journal entry:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ في تعديل القيد" },
      { status: 400 }
    )
  }
}

// DELETE /api/journal/[id] - Delete/void journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const result = await deleteJournalEntry(params.id)

    // Revalidate relevant pages
    revalidatePath("/dashboard/journal")
    revalidatePath("/dashboard/accounts")

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error deleting journal entry:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ في حذف القيد" },
      { status: 400 }
    )
  }
}