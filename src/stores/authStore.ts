import { create } from 'zustand'
import { superTokensAuthService, type SessionUser } from '@/services/stAuthService'
import type { UserRole } from '@/types/study'

interface User extends SessionUser { role: UserRole }

const ROLE_MAP: Record<string, UserRole> = {
  'admin': 'admin',
  'reporting_radiologist': 'reporting-radiologist',
  'validating_radiologist': 'validating-radiologist',
  'reporting-radiologist': 'reporting-radiologist',
  'validating-radiologist': 'validating-radiologist',
}

const DEFAULT_ROLE: UserRole = 'reporting-radiologist'

interface AuthState {
  user: Partial<User>
  getUserInfo: () => Promise<void>
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: () => Promise<boolean>
  isAdmin: () => boolean
  isReportingRadiologist: () => boolean
  isValidatingRadiologist: () => boolean
  fullName: () => string
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {} as Partial<User>,

  async getUserInfo() {
    const user = await superTokensAuthService.user()
    set({ user: { ...user, role: ROLE_MAP[user.role] || DEFAULT_ROLE } })
  },

  async signIn(username, password) {
    if (!await get().isAuthenticated()) {
      await superTokensAuthService.signIn(username, password)
    }
  },

  async signOut() {
    await superTokensAuthService.signOut()
    set({ user: {} as Partial<User> })
  },

  async isAuthenticated() {
    return !await superTokensAuthService.expired()
  },

  isAdmin: () => get().user.role === 'admin',
  isReportingRadiologist: () => get().user.role === 'reporting-radiologist',
  isValidatingRadiologist: () => get().user.role === 'validating-radiologist',
  fullName: () => {
    const u = get().user
    return u ? `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() : ''
  },
}))

export { useAuthStore as useSupertokensAuthStore }
