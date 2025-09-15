"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface DeleteAccountButtonProps {
  accountId: string
}

export function DeleteAccountButton({ accountId }: DeleteAccountButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الحساب؟")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard/accounts")
        router.refresh()
      } else {
        alert("حدث خطأ أثناء حذف الحساب")
      }
    } catch (error) {
      alert("حدث خطأ أثناء حذف الحساب")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:text-red-700"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4 ml-2" />
      {isDeleting ? "جاري الحذف..." : "حذف"}
    </Button>
  )
}