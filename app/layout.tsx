import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "لوحة التحكم",
  description: "نظام إدارة المحتوى",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-cairo antialiased">
        {children}
      </body>
    </html>
  )
}