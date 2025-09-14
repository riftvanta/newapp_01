"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("حدث خطأ في تسجيل الدخول")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl font-bold text-center">تسجيل الدخول</CardTitle>
        <CardDescription className="text-center">
          أدخل بيانات الدخول للوصول إلى لوحة التحكم
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              type="text"
              placeholder="أدخل اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className="text-right h-12 text-base"
              dir="rtl"
              autoComplete="username"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="text-right h-12 text-base"
              dir="rtl"
              autoComplete="current-password"
              inputMode="text"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 text-center">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isLoading}
          >
            {isLoading ? "جاري تسجيل الدخول..." : "دخول"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}