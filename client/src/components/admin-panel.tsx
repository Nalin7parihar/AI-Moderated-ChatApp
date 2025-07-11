"use client"

import { useState } from "react"
import type { AdminUser } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Edit, Shield } from "lucide-react"

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: 1,
      name: "John Doe",
      username: "john_doe",
      email: "john@example.com",
      full_name: "John Doe",
      is_active: true,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Demo User",
      username: "demo_user",
      email: "demo@example.com",
      full_name: "Demo User",
      is_active: true,
      is_admin: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Jane Smith",
      username: "jane_smith",
      email: "jane@example.com",
      full_name: "Jane Smith",
      is_active: true,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 4,
      name: "Bob Wilson",
      username: "bob_wilson",
      email: "bob@example.com",
      full_name: "Bob Wilson",
      is_active: false,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editUserData, setEditUserData] = useState<Partial<AdminUser>>({})

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setEditUserData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
      is_admin: user.is_admin,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, ...editUserData } : user)))
    setIsEditDialogOpen(false)
  }

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="h-5 w-5 text-blue-400" />
            <span>User Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-750"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white">{user.username}</h3>
                      {user.is_admin && (
                        <Badge variant="secondary" className="bg-blue-600 text-white">
                          Admin
                        </Badge>
                      )}
                      {!user.is_active && (
                        <Badge variant="destructive" className="bg-red-600 text-white">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    {user.full_name && <p className="text-sm text-gray-400">{user.full_name}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username" className="text-gray-300">
                Username
              </Label>
              <Input
                id="edit-username"
                value={editUserData.username || ""}
                onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email || ""}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-full-name" className="text-gray-300">
                Full Name
              </Label>
              <Input
                id="edit-full-name"
                value={editUserData.full_name || ""}
                onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-active"
                checked={editUserData.is_active || false}
                onCheckedChange={(checked) => setEditUserData({ ...editUserData, is_active: checked })}
              />
              <Label htmlFor="edit-is-active" className="text-gray-300">
                Active
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-admin"
                checked={editUserData.is_admin || false}
                onCheckedChange={(checked) => setEditUserData({ ...editUserData, is_admin: checked })}
              />
              <Label htmlFor="edit-is-admin" className="text-gray-300">
                Admin
              </Label>
            </div>
            <Button onClick={handleUpdateUser} className="w-full bg-blue-600 hover:bg-blue-700">
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
