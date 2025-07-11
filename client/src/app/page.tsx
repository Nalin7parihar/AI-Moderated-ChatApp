"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AppHeader } from "@/components/app-header"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatMessages } from "@/components/chat-messages"

export default function HomePage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null) // Start with no chat selected

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-gray-900">
        <AppHeader />
        
        {/* Main Chat Content */}
        <div className="flex-1 flex">
          <ChatSidebar selectedChatId={selectedChatId} onChatSelect={setSelectedChatId} />
          <ChatMessages chatId={selectedChatId || ""} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
