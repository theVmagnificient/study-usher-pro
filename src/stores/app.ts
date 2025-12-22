import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserRole } from '@/types/study'

export const useAppStore = defineStore('app', () => {
  const currentRole = ref<UserRole>('admin')
  const theme = ref<'light' | 'dark' | 'system'>('system')

  const isDark = computed(() => {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  function setRole(role: UserRole) {
    currentRole.value = role
  }

  function setTheme(newTheme: 'light' | 'dark' | 'system') {
    theme.value = newTheme
    if (newTheme !== 'system') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
    localStorage.setItem('theme', newTheme)
  }

  function toggleTheme() {
    const current = isDark.value ? 'dark' : 'light'
    setTheme(current === 'dark' ? 'light' : 'dark')
  }

  // Initialize theme
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('system')
    }
  }

  return {
    currentRole,
    theme,
    isDark,
    setRole,
    setTheme,
    toggleTheme
  }
})

