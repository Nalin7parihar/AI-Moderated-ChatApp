"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Send, MoreVertical, Edit, Trash2, Loader2, MessageCircle } from "lucide-react"
import { format } from "date-fns"
import { api } from "@/lib/api"
import { Message } from "@/types/message"

interface ChatMessagesProps {
  chatId: string
}

export function ChatMessages({ chatId }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, token } = useAuth()

  // Load messages when chat changes
  useEffect(() => {
    if (chatId) {
      loadMessages()
    }
  }, [chatId, token])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    if (!token || !chatId) return
    
    try {
      setLoading(true)
      setError("")
      const messageData = await api.getMessages(token, chatId)
      setMessages(messageData)
    } catch (error: any) {
      setError(error.message || "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !token || !chatId || sending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      const sentMessage = await api.sendMessage(token, {
        content: messageContent,
        chat_id: chatId
      })
      setMessages([...messages, sentMessage])
    } catch (error: any) {
      setError(error.message || "Failed to send message")
      setNewMessage(messageContent) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  const handleEditMessage = async (messageId: number) => {
    if (!token || !editingContent.trim()) return

    try {
      const updatedMessage = await api.updateMessage(token, messageId.toString(), editingContent.trim())
      setMessages(messages.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ))
      setEditingMessageId(null)
      setEditingContent("")
    } catch (error: any) {
      setError(error.message || "Failed to update message")
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return

    try {
      await api.deleteMessage(token, messageId.toString())
      setMessages(messages.filter(msg => msg.id !== messageId))
    } catch (error: any) {
      setError(error.message || "Failed to delete message")
    }
  }

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No chat selected</h3>
          <p>Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={loadMessages} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender.id === user?.id
              const isEditing = editingMessageId === message.id

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group`}
                >
                  <div className={`flex space-x-2 max-w-[70%] ${isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {!isCurrentUser && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-gray-600 text-white text-xs">
                          {getInitials(message.sender.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isCurrentUser
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {!isCurrentUser && (
                        <p className="text-xs text-gray-300 mb-1">{message.sender.name}</p>
                      )}
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="bg-gray-800 border-gray-600 text-white"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleEditMessage(message.id)
                              }
                              if (e.key === "Escape") {
                                cancelEditing()
                              }
                            }}
                            autoFocus
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
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="break-words">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">
                              {format(new Date(message.created_at), "HH:mm")}
                            </p>
                            {isCurrentUser && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                  <DropdownMenuItem
                                    onClick={() => startEditing(message)}
                                    className="text-gray-300 hover:bg-gray-700"
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            disabled={sending}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
