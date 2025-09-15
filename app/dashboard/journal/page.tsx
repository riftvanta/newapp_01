import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { JournalListClient } from "./journal-list-client"
import { getJournalEntries } from "@/lib/journal"

export default async function JournalPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Fetch initial journal entries
  const { entries, total } = await getJournalEntries({
    take: 20,
    status: "POSTED" // Only show posted entries by default
  })

  return (
    <DashboardLayout>
      <JournalListClient initialEntries={entries} initialTotal={total} />
    </DashboardLayout>
  )
}