import { create } from 'zustand'
import axiosClient from '../api/axiosClient'
import { decodeToken, isTokenExpired } from '../utils/jwt'
import type { JwtPayload, LoginPayload, RegisterPayload } from '../types'

interface AuthState {
  token: string | null
  user: JwtPayload | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  error: string | null

  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  initialize: () => void
  clearError: () => void
}

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  error: null,

  initialize: () => {
    const token = localStorage.getItem('token')
    if (token && !isTokenExpired(token)) {
      const user = decodeToken(token)
      set({
        token,
        user,
        isAuthenticated: true,
        isAdmin: user?.role === 'ADMIN',
      })
    } else {
      localStorage.removeItem('token')
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      })
    }
  },

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await axiosClient.post('/api/auth/login', payload)
      const { token } = data
      const user = decodeToken(token)

      if (!user) {
        throw new Error('Invalid token received')
      }

      localStorage.setItem('token', token)
      set({
        token,
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isLoading: false,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await axiosClient.post('/api/auth/register', payload)
      const { token } = data
      const user = decodeToken(token)

      if (!user) {
        throw new Error('Invalid token received')
      }

      localStorage.setItem('token', token)
      set({
        token,
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isLoading: false,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,
    })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
