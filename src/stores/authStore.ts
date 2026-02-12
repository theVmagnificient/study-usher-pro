import { defineStore } from 'pinia'
import { apiClient } from '@/lib/api/client'
import { superTokensAuthService } from '@/services/stAuthService'
import type { UserRole } from '@/types/study'

export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
}

interface UserInfoResponse {
  id: number
  email: string
  first_name: string
  last_name: string
  role?: string
}

const mapRole = (backendRole: string | null): UserRole => {
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

export const useSupertokensAuthStore = defineStore('supertokensAuth', {
  state: () => ({
    user: {} as AuthUser,
    role: 'reporting-radiologist' as UserRole,
  }),

  getters: {
    isAdmin: (state) => state.role == "admin",
    fullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
  },

  actions: {
    async getUserInfo() {
      if (await superTokensAuthService.expired()) {
        await superTokensAuthService.refresh()
      }

      const { data } = await apiClient.get<UserInfoResponse>('/api/v1/auth/me')

      this.user = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
      }
      this.role = mapRole(data.role)
    },

    async signIn(username: string, password: string) {
      if (await this.isAuthenticated()) {
        return
      }

      await superTokensAuthService.signIn(username, password)
    },

    async signOut() {
      await superTokensAuthService.signOut()
    },

    async isAuthenticated() {
      return !await superTokensAuthService.expired()
    },
  },
})

export { useSupertokensAuthStore as useAuthStore }
