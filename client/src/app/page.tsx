"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { AppHeader } from "@/components/app-header"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatMessages } from "@/components/chat-messages"
import { useChatContext } from "@/contexts/Chat-Context"

export default function HomePage() {
  const { selectedChatId, setSelectedChatId } = useChatContext()

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-gray-900">
        <AppHeader />
        
        {/* Main Chat Content */}
        <div className="flex-1 flex">
          <ChatSidebar selectedChatId={selectedChatId} onChatSelect={setSelectedChatId} />
          <ChatMessages chatId={selectedChatId || 0} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
