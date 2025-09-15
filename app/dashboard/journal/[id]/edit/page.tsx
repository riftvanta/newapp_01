import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { JournalEntryForm } from "@/components/journal/JournalEntryForm"
import { getJournalEntry } from "@/lib/journal"

export default async function EditJournalEntryPage({
  params
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const entry = await getJournalEntry(params.id)

  if (!entry) {
    redirect("/dashboard/journal")
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <JournalEntryForm entry={entry} mode="edit" />
      </div>
    </DashboardLayout>
  )
}