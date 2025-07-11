"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { AppHeader } from "@/components/app-header"
import { AdminPanel } from "@/components/admin-panel"

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="h-screen flex flex-col bg-gray-900">
        <AppHeader />
        
        <div className="flex-1 overflow-auto">
          <AdminPanel />
        </div>
      </div>
    </ProtectedRoute>
  )
}
