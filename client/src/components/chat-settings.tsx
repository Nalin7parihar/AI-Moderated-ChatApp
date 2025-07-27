"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Settings, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Trash2, 
  LogOut, 
  Users, 
  MoreVertical,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useChatContext } from "@/contexts/Chat-Context"
import { Chat } from "@/types/chat"
import { User } from "@/types/user"

interface ChatSettingsProps {
  chatId: string
  onChatDeleted?: () => void
}

export function ChatSettings({ chatId, onChatDeleted }: ChatSettingsProps) {
  const { user } = useAuth()
  const { 
    chats, 
    updateChat, 
    deleteChat, 
    addParticipant, 
    removeParticipant, 
    leaveChat, 
    getChatParticipants,
    getChat 
  } = useChatContext()
  
  // Find current chat
  const currentChat = chats.find(chat => chat.id.toString() === chatId)
  
  // Component state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddParticipantDialogOpen, setIsAddParticipantDialogOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [participantsLoading, setParticipantsLoading] = useState(false)
  
  // Form states
  const [editTitle, setEditTitle] = useState("")
  const [newParticipantEmail, setNewParticipantEmail] = useState("")
  const [participants, setParticipants] = useState<User[]>([])
  
  // Error states
  const [error, setError] = useState("")
  const [participantError, setParticipantError] = useState("")

  // Initialize edit form when chat changes
  useEffect(() => {
    if (currentChat) {
      setEditTitle(currentChat.title || "")
      setParticipants(currentChat.participants || [])
    }
  }, [currentChat])

  // Load participants when settings open
  useEffect(() => {
    if (isSettingsOpen && chatId) {
      loadParticipants()
    }
  }, [isSettingsOpen, chatId])

  const loadParticipants = async () => {
    try {
      setParticipantsLoading(true)
      const participantsData = await getChatParticipants(parseInt(chatId))
      setParticipants(participantsData)
    } catch (error: any) {
      console.error('Error loading participants:', error)
      setError(error.message || "Failed to load participants")
    } finally {
      setParticipantsLoading(false)
    }
  }

  const handleUpdateChat = async () => {
    if (!editTitle.trim()) {
      setError("Chat title cannot be empty")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      await updateChat(parseInt(chatId), { 
        title: editTitle.trim() 
      })
      
      setIsEditDialogOpen(false)
    } catch (error: any) {
      console.error('Error updating chat:', error)
      setError(error.message || "Failed to update chat")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async () => {
    try {
      setLoading(true)
      setError("")
      
      await deleteChat(parseInt(chatId))
      
      setIsDeleteDialogOpen(false)
      setIsSettingsOpen(false)
      onChatDeleted?.()
    } catch (error: any) {
      console.error('Error deleting chat:', error)
      setError(error.message || "Failed to delete chat")
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!newParticipantEmail.trim()) {
      setParticipantError("Please enter an email address")
      return
    }

    try {
      setLoading(true)
      setParticipantError("")
      
      await addParticipant(parseInt(chatId), newParticipantEmail.trim())
      
      // Refresh participants list
      await loadParticipants()
      
      setNewParticipantEmail("")
      setIsAddParticipantDialogOpen(false)
    } catch (error: any) {
      console.error('Error adding participant:', error)
      setParticipantError(error.message || "Failed to add participant")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveParticipant = async (participantEmail: string) => {
    try {
      setLoading(true)
      setError("")
      
      await removeParticipant(parseInt(chatId), participantEmail)
      
      // Refresh participants list
      await loadParticipants()
    } catch (error: any) {
      console.error('Error removing participant:', error)
      setError(error.message || "Failed to remove participant")
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveChat = async () => {
    try {
      setLoading(true)
      setError("")
      
      await leaveChat(parseInt(chatId))
      
      setIsLeaveDialogOpen(false)
      setIsSettingsOpen(false)
      onChatDeleted?.() // Same effect as deletion for the current user
    } catch (error: any) {
      console.error('Error leaving chat:', error)
      setError(error.message || "Failed to leave chat")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!currentChat) {
    return null
  }

  const isOwner = currentChat.participants.find(p => p.id === user?.id) // You might want to add an owner field to your Chat type

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Chat Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage chat details and participants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Chat Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">
                  {currentChat.title || "Untitled Chat"}
                </h3>
                <p className="text-sm text-gray-400">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddParticipantDialogOpen(true)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <ScrollArea className="h-48 border border-gray-700 rounded-lg p-3">
              {participantsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No participants found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {getInitials(participant.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {participant.name}
                            {participant.id === user?.id && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-gray-600">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{participant.email}</p>
                        </div>
                      </div>
                      
                      {participant.id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem
                              onClick={() => handleRemoveParticipant(participant.email)}
                              className="text-red-400 hover:bg-gray-700"
                              disabled={loading}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-700 pt-6 space-y-4">
            <h4 className="text-md font-medium text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </h4>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsLeaveDialogOpen(true)}
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Edit Chat Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Chat</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update chat title and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-title" className="text-gray-300">
                Chat Title
              </Label>
              <Input
                id="chat-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter chat title"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateChat}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={isAddParticipantDialogOpen} onOpenChange={setIsAddParticipantDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Participant</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the email address of the person you want to add to this chat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="participant-email" className="text-gray-300">
                Email Address
              </Label>
              <Input
                id="participant-email"
                type="email"
                value={newParticipantEmail}
                onChange={(e) => setNewParticipantEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            {participantError && (
              <Alert variant="destructive">
                <AlertDescription>{participantError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddParticipantDialogOpen(false)
                setNewParticipantEmail("")
                setParticipantError("")
              }}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddParticipant}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete Chat
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this chat? This action cannot be undone.
              All messages and chat history will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteChat}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Chat Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <LogOut className="h-5 w-5 text-yellow-400" />
              Leave Chat
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to leave this chat? You won't be able to see new messages
              unless someone adds you back to the chat.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLeaveDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLeaveChat}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Leave Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
