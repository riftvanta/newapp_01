import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { JournalEntryFormNew } from "@/components/journal/JournalEntryFormNew"

export default async function NewJournalEntryPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <JournalEntryFormNew mode="create" />
      </div>
    </DashboardLayout>
  )
}