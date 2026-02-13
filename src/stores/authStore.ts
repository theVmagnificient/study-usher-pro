import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/lib/api/client'
import type { UserRole } from '@/types/study'

export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
}

interface LoginResponse {
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  role: string | null
  token: string
}


function mapRole(backendRole: string | null): UserRole {
  if (!backendRole) return 'admin'
  const roleMap: Record<string, UserRole> = {
    'admin': 'admin',
    // Backend format with underscores
    'reporting_radiologist': 'reporting-radiologist',
    'validating_radiologist': 'validating-radiologist',
    // Also support kebab-case format (in case backend already returns it)
    'reporting-radiologist': 'reporting-radiologist',
    'validating-radiologist': 'validating-radiologist',
  }
  return roleMap[backendRole] || 'admin'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const role = ref<UserRole | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => role.value === 'admin')
  const userId = computed(() => user.value?.id ?? null)
  const fullName = computed(() => user.value ? `${user.value.firstName} ${user.value.lastName}` : '')


  function initialize() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    const savedRole = localStorage.getItem('auth_role')

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      // Map the saved role to handle both old and new formats
      role.value = mapRole(savedRole)

      // Update localStorage with the correct format if it was different
      if (savedRole !== role.value) {
        localStorage.setItem('auth_role', role.value)
      }
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', {
        email,
        password,
      })

      const data = response.data


      user.value = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
      }
      role.value = mapRole(data.role)
      token.value = data.token


      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(user.value))
      localStorage.setItem('auth_role', role.value)

      return true
    } catch (err: any) {
      error.value = err?.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    role.value = null
    token.value = null
    error.value = null

    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_role')
  }


  initialize()

  return {
    user,
    role,
    token,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    userId,
    fullName,
    login,
    logout,
    initialize,
  }
})
