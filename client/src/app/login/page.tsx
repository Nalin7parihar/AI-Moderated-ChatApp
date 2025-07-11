"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const { login, register } = useAuth()
  const router = useRouter()

  // Real-time validation helper
  const validateField = (fieldName: string, value: string) => {
    const errors = { ...fieldErrors }
    
    switch (fieldName) {
      case 'name':
        if (value.trim().length > 0 && value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters long'
        } else {
          delete errors.name
        }
        break
      case 'email':
        if (value.trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.email = 'Please enter a valid email address'
          } else {
            delete errors.email
          }
        } else {
          delete errors.email
        }
        break
      case 'password':
        if (value.length > 0 && value.length < 6) {
          errors.password = 'Password must be at least 6 characters long'
        } else {
          delete errors.password
        }
        break
      case 'username':
        if (value.trim().length === 0) {
          delete errors.username
        }
        break
    }
    
    setFieldErrors(errors)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Basic client-side validation
    if (!credentials.username.trim()) {
      setError("Please enter your username.")
      setIsLoading(false)
      return
    }

    if (!credentials.password) {
      setError("Please enter your password.")
      setIsLoading(false)
      return
    }

    try {
      await login(credentials)
      setSuccess("Login successful! Redirecting...")
      // Small delay to show success message before redirect
      setTimeout(() => router.push("/"), 500)
    } catch (error: any) {
      console.error('Login error:', error)
      
      // The API now provides detailed error messages, so we can use them directly
      setError(error.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Enhanced client-side validation
    if (!registerData.name.trim()) {
      setError("Please enter your full name.")
      setIsLoading(false)
      return
    }

    if (registerData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long.")
      setIsLoading(false)
      return
    }

    if (!registerData.email.trim()) {
      setError("Please enter your email address.")
      setIsLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerData.email)) {
      setError("Please enter a valid email address.")
      setIsLoading(false)
      return
    }

    if (!registerData.password) {
      setError("Please enter a password.")
      setIsLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters long.")
      setIsLoading(false)
      return
    }

    try {
      const result = await register(registerData)
      if (result.success) {
        setSuccess(result.message)
        // Clear the form
        setRegisterData({ name: "", email: "", password: "" })
        // Switch to login form after a delay
        setTimeout(() => {
          setIsLogin(true)
          setSuccess("")
        }, 3000)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // The API now provides detailed error messages, so we can use them directly
      setError(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Sign In" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin 
              ? "Enter your credentials to access the chat application"
              : "Create a new account to start chatting"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => {
                    setCredentials({ ...credentials, username: e.target.value })
                    validateField('username', e.target.value)
                  }}
                  required
                  className={fieldErrors.username ? "border-red-500" : ""}
                />
                {fieldErrors.username && (
                  <p className="text-sm text-red-500">{fieldErrors.username}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => {
                    setCredentials({ ...credentials, password: e.target.value })
                    validateField('password', e.target.value)
                  }}
                  required
                  className={fieldErrors.password ? "border-red-500" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-500 text-green-700 bg-green-50">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={registerData.name}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, name: e.target.value })
                    validateField('name', e.target.value)
                  }}
                  required
                  className={fieldErrors.name ? "border-red-500" : ""}
                />
                {fieldErrors.name && (
                  <p className="text-sm text-red-500">{fieldErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, email: e.target.value })
                    validateField('email', e.target.value)
                  }}
                  required
                  className={fieldErrors.email ? "border-red-500" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, password: e.target.value })
                    validateField('password', e.target.value)
                  }}
                  required
                  className={fieldErrors.password ? "border-red-500" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-500 text-green-700 bg-green-50">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          )}
          
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
                setSuccess("")
                setFieldErrors({})
              }}
              className="text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
