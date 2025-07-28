import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { ErrorBoundary } from "@/components/error-boundary"
import { ChatProvider } from "@/contexts/Chat-Context"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chat Application",
  description: "A modern web chat application built with Next.js and TypeScript",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <ChatProvider>{children}</ChatProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
