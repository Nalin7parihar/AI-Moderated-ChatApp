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
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get user data
      loadUserData(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserData = async (authToken: string, retries = 2) => {
    let lastError: any = null;
    try {
      const userData = await api.getCurrentUser(authToken);
      setUser(userData);
    } catch (error: any) {
      lastError = error;
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
