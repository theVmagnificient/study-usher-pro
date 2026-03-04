import { defineStore } from 'pinia'
import { superTokensAuthService, type SessionUser } from '@/services/stAuthService'
import type { UserRole } from '@/types/study'

interface User extends SessionUser { role: UserRole }

const ROLE_MAP: { [k: string]: UserRole } = {
  'admin': 'admin',
  'reporting_radiologist': 'reporting-radiologist',
  'validating_radiologist': 'validating-radiologist',
  'reporting-radiologist': 'reporting-radiologist',
  'validating-radiologist': 'validating-radiologist',
}

const DEFAULT_ROLE: UserRole = 'reporting-radiologist'

export const useSupertokensAuthStore = defineStore('supertokensAuth', {
  state: () => ({ user: {} as User }),

  getters: {
    isAdmin: (state) => state.user.role === 'admin',
    isReporingRadiologist: (state) => state.user.role === 'reporting-radiologist',
    isValidatingRadiologist: (state) => state.user.role === 'validating-radiologist',
    fullName: (state) => state.user ? `${state.user.firstname} ${state.user.lastname}` : '',
  },

  actions: {
    async getUserInfo() {
      const sessionUser = await superTokensAuthService.user()
      this.user = { ...sessionUser, role: ROLE_MAP[sessionUser.role] || DEFAULT_ROLE }
    },

    async signIn(username: string, password: string) {
      if (await this.isAuthenticated()) return
      await superTokensAuthService.signIn(username, password)
      // After successful sign-in, session tokens are already set by the SDK
    },

    async signOut() {
      await superTokensAuthService.signOut()
      this.user = {} as User
    },

    async isAuthenticated() {
      return !await superTokensAuthService.expired()
    },
  },
})

export { useSupertokensAuthStore as useAuthStore }
