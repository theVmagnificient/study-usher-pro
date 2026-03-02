import { create } from 'zustand'
import type { UserRole } from '@/types/study'

interface AppState {
  currentRole: UserRole
  theme: 'light' | 'dark' | 'system'
  isDark: () => boolean
  setRole: (role: UserRole) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (theme !== 'system') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  }
  localStorage.setItem('theme', theme)
}

const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null) ?? 'system'
applyTheme(savedTheme)

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'admin',
  theme: savedTheme,

  isDark: () => {
    const { theme } = get()
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
    return theme === 'dark'
  },

  setRole: (role) => set({ currentRole: role }),

  setTheme: (newTheme) => {
    applyTheme(newTheme)
    set({ theme: newTheme })
  },

  toggleTheme: () => {
    const current = get().isDark() ? 'dark' : 'light'
    get().setTheme(current === 'dark' ? 'light' : 'dark')
  },
}))
