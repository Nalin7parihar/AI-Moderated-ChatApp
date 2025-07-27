'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from '@/types/user';
import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    // Add a small delay to prevent hydration issues
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken && storedToken.trim() !== '') {
          setToken(storedToken);
          // Verify token and get user data
          await loadUserData(storedToken);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadUserData = async (authToken: string, retries = 2) => {
    let lastError: any = null;
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error: any) {
      lastError = error;
      
      // Handle specific authentication errors gracefully
      if (error.message === 'AUTHENTICATION_EXPIRED' || error.message === 'AUTHENTICATION_REQUIRED') {
        console.log('Authentication session expired or invalid, clearing token');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        return;
      }
      
      console.error('Failed to load user data:', error);
      
      // Retry on network errors
      if (retries > 0 && (
        error.message.includes('Network') || 
        error.message.includes('timeout') ||
        error.message.includes('Unable to connect')
      )) {
        console.log(`Retrying user data load (${retries} attempts remaining)...`);
        setTimeout(() => loadUserData(authToken, retries - 1), 1000);
        return;
      }
      
      // If token is invalid or retries exhausted, clear it
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      // Only set loading to false if we're not retrying
      if (retries === 0 || !lastError || !(
        lastError.message?.includes('Network') || 
        lastError.message?.includes('timeout') ||
        lastError.message?.includes('Unable to connect')
      )) {
        setLoading(false);
      }
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const response: AuthResponse = await api.login(credentials);
      
      // Store token
      localStorage.setItem('token', response.access_token);
      setToken(response.access_token);
      
      // Get user data
      await loadUserData(response.access_token);
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Clear any existing token on login failure
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      
      // Re-throw the error with better message
      if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true);
      const newUser = await api.register(userData);
      
      // Just return success - don't auto-login
      return { success: true, message: 'Account created successfully! Please sign in.' };
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Re-throw the error with better message
      if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  // Show loading screen during initial authentication check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
