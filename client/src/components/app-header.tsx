"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Settings, Shield } from "lucide-react"

export function AppHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleAdminClick = () => {
    router.push("/admin")
  }

  return (
    <header className="border-b border-gray-700 bg-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Chat Application</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">Welcome, {user?.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-700">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-600 text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={handleSettingsClick}
                className="text-gray-200 hover:bg-gray-700 cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleAdminClick}
                className="text-gray-200 hover:bg-gray-700 cursor-pointer"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={logout} 
                className="text-gray-200 hover:bg-gray-700 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
