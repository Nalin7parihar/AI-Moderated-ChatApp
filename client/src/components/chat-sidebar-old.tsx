"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Users, MessageCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Chat } from "@/types/chat"

interface ChatSidebarProps {
  selectedChatId: string | null
  onChatSelect: (chatId: string) => void
}

export function ChatSidebar({ selectedChatId, onChatSelect }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newChatData, setNewChatData] = useState({
    title: "",
    participant_emails: "",
  })
  const { token, user } = useAuth()

  // Load chats on component mount
  useEffect(() => {
    loadChats()
  }, [token])

  const loadChats = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      setError("")
      const chatData = await api.getChats(token)
      setChats(chatData)
    } catch (error: any) {
      setError(error.message || "Failed to load chats")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChat = async () => {
    if (!token || !user) return
    
    setCreateLoading(true)
    setError("")
    
    try {
      // Parse participant emails
      const emails = newChatData.participant_emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)
      
      if (emails.length === 0) {
        setError("Please enter at least one participant email")
        return
      }
      
      // For now, we'll need to get user IDs from emails
      // This is a limitation - ideally we'd have a user search endpoint
      // For demo purposes, we'll create a basic chat structure
      const newChat = await api.createChat(token, {
        title: newChatData.title || "New Chat",
        participant_ids: [user.id] // Start with just current user, participants can be added later
      })
      
      setChats([newChat, ...chats])
      setIsCreateDialogOpen(false)
      setNewChatData({ title: "", participant_emails: "" })
    } catch (error: any) {
      setError(error.message || "Failed to create chat")
    } finally {
      setCreateLoading(false)
    }
  }

  const filteredChats = chats.filter((chat) => 
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getParticipantNames = (chat: Chat) => {
    return chat.participants
      .filter(p => p.id !== user?.id)
      .map(p => p.name)
      .join(", ") || "Empty chat"
  }

  const getInitials = (chat: Chat) => {
    if (chat.title) return chat.title.substring(0, 2).toUpperCase()
    const otherParticipants = chat.participants.filter(p => p.id !== user?.id)
    if (otherParticipants.length > 0) {
      return otherParticipants[0].name.substring(0, 2).toUpperCase()
    }
    return "CH"
  }

  return (
    <div className="w-80 border-r border-gray-700 bg-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Chats</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="chat-name" className="text-gray-300">
                    Chat Name
                  </Label>
                  <Input
                    id="chat-name"
                    value={newChatData.name}
                    onChange={(e) => setNewChatData({ ...newChatData, name: e.target.value })}
                    placeholder="Enter chat name"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="chat-description" className="text-gray-300">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="chat-description"
                    value={newChatData.description}
                    onChange={(e) => setNewChatData({ ...newChatData, description: e.target.value })}
                    placeholder="Enter chat description"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-group"
                    checked={newChatData.is_group}
                    onCheckedChange={(checked) => setNewChatData({ ...newChatData, is_group: checked })}
                  />
                  <Label htmlFor="is-group" className="text-gray-300">
                    Group Chat
                  </Label>
                </div>
                <Button onClick={handleCreateChat} className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Chat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`p-3 rounded-lg cursor-pointer hover:bg-gray-700 mb-2 ${
                selectedChatId === chat.id ? "bg-blue-900 border border-blue-700" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-gray-600">
                    {chat.is_group ? (
                      <Users className="h-4 w-4 text-gray-300" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-gray-300" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate text-white">{chat.name}</p>
                    {chat.is_group && (
                      <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-200">
                        {chat.participants.length}
                      </Badge>
                    )}
                  </div>
                  {chat.description && <p className="text-xs text-gray-400 truncate">{chat.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
