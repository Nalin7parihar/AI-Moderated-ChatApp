"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Send, MoreVertical, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface ChatMessagesProps {
  chatId: string
}

// Mock message interface for UI compatibility
interface UIMessage {
  id: string
  content: string
  chat_id: string
  sender_id: number
  sender: { id: number; name: string; email: string }
  created_at: string
  updated_at: string
  is_edited: boolean
}

export function ChatMessages({ chatId }: ChatMessagesProps) {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: "1",
      content: "Hey there! How's the project coming along?",
      chat_id: "1",
      sender_id: 1,
      sender: { id: 1, name: "John Doe", email: "john@example.com" },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      is_edited: false,
    },
    {
      id: "2",
      content: "It's going really well! Just finished the authentication system.",
      chat_id: "1",
      sender_id: 2,
      sender: { id: 2, name: "Demo User", email: "demo@example.com" },
      created_at: new Date(Date.now() - 3000000).toISOString(),
      updated_at: new Date(Date.now() - 3000000).toISOString(),
      is_edited: false,
    },
    {
      id: "3",
      content: "That's awesome! The UI looks great too. Really clean design.",
      chat_id: "1",
      sender_id: 1,
      sender: { id: 1, name: "John Doe", email: "john@example.com" },
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      is_edited: false,
    },
    {
      id: "4",
      content: "Thanks! I'm really happy with how it turned out. The chat interface is very intuitive.",
      chat_id: "1",
      sender_id: 2,
      sender: { id: 2, name: "Demo User", email: "demo@example.com" },
      created_at: new Date(Date.now() - 900000).toISOString(),
      updated_at: new Date(Date.now() - 900000).toISOString(),
      is_edited: false,
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const { user } = useAuth()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: UIMessage = {
      id: Date.now().toString(),
      content: newMessage,
      chat_id: chatId,
      sender_id: user?.id || 2,
      sender: user || { id: 2, name: "Demo User", email: "demo@example.com" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleEditMessage = async (messageId: string) => {
    setMessages(
      messages.map((msg) => (msg.id === messageId ? { ...msg, content: editingContent, is_edited: true } : msg)),
    )
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleDeleteMessage = async (messageId: string) => {
    setMessages(messages.filter((msg) => msg.id !== messageId))
  }

  const startEditing = (message: any) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white">No chat selected</h3>
          <p className="text-gray-400">Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === user?.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {message.sender_id !== user?.id && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-600 text-gray-200">
                            {message.sender.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-gray-300">{message.sender.name}</span>
                      </div>
                    )}
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="text-sm bg-gray-600 border-gray-500 text-white"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditMessage(message.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMessageId(null)}
                            className="border-gray-500 text-gray-300 hover:bg-gray-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {format(new Date(message.created_at), "HH:mm")}
                        {message.is_edited && " (edited)"}
                      </span>
                    </div>
                  </div>
                  {message.sender_id === user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2 hover:bg-gray-600">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem
                          onClick={() => startEditing(message)}
                          className="text-gray-200 hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-red-400 hover:bg-gray-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
