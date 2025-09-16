import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { JournalListSimple } from "./journal-list-simple"
import { getJournalEntries } from "@/lib/journal"

export default async function JournalPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Fetch initial journal entries
  const { entries, total } = await getJournalEntries({
    take: 50 // Get more entries at once
  })

  return (
    <DashboardLayout>
      <JournalListSimple initialEntries={entries} initialTotal={total} />
    </DashboardLayout>
  )
}