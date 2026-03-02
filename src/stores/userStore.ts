import { create } from 'zustand'
import type { Physician, UserRole } from '@/types/study'
import type { ScheduleSlot } from '@/types/api'
import {
  userService,
  type UserCreateData,
  type UserUpdateData,
  type ProfileUpdateData,
  type ScheduleSlotData,
  type DateRange,
} from '@/services/userService'
import { parseUserId } from '@/lib/mappers/utils'

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface UserState {
  users: Physician[]
  currentUser: Physician | null
  currentProfile: Physician | null
  schedule: ScheduleSlot[]
  loading: boolean
  error: string | null
  pagination: Pagination

  fetchUsers: (page?: number) => Promise<void>
  fetchUserById: (id: number) => Promise<void>
  fetchUserByFrontendId: (id: string) => Promise<void>
  createUser: (data: UserCreateData) => Promise<void>
  updateUser: (id: number, data: UserUpdateData) => Promise<void>
  deleteUser: (id: number) => Promise<void>
  fetchProfile: (userId: number, authUser?: { firstName: string; lastName: string; email: string }) => Promise<void>
  updateProfile: (userId: number, data: ProfileUpdateData) => Promise<void>
  fetchSchedule: (userId: number, dateRange?: DateRange) => Promise<void>
  createScheduleSlot: (userId: number, slot: ScheduleSlotData) => Promise<void>
  deleteScheduleSlot: (userId: number, slotId: number) => Promise<void>
  bulkUpdateSchedule: (userId: number, slots: ScheduleSlotData[]) => Promise<void>
  nextPage: () => Promise<void>
  previousPage: () => Promise<void>
  goToPage: (page: number) => Promise<void>
  refresh: () => Promise<void>

  usersByRole: (role: UserRole) => Physician[]
  reportingRadiologists: () => Physician[]
  validatingRadiologists: () => Physician[]
  admins: () => Physician[]
  userById: (id: string) => Physician | undefined
  totalUsers: () => number
  hasNextPage: () => boolean
  hasPreviousPage: () => boolean
  usersGroupedByRole: () => Record<UserRole, Physician[]>
  availablePhysicians: () => Physician[]
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  currentProfile: null,
  schedule: [],
  loading: false,
  error: null,
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },

  async fetchUsers(page) {
    set({ loading: true, error: null })
    try {
      const pageToFetch = page !== undefined ? page : get().pagination.page
      const result = await userService.getAll(pageToFetch, get().pagination.perPage)
      set({
        users: result.items,
        pagination: { page: result.page, perPage: result.perPage, total: result.total, totalPages: result.totalPages },
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch users' })
      console.error('Error fetching users:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchUserById(id) {
    set({ loading: true, error: null })
    try {
      const user = await userService.getById(id)
      set(state => ({
        currentUser: user,
        users: state.users.map(u => u.id === user.id ? user : u),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to fetch user ${id}` })
      console.error(`Error fetching user ${id}:`, err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchUserByFrontendId(id) {
    await get().fetchUserById(parseUserId(id))
  },

  async createUser(data) {
    set({ loading: true, error: null })
    try {
      await userService.create(data)
      await get().fetchUsers()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create user' })
      console.error('Error creating user:', err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async updateUser(id, data) {
    set({ loading: true, error: null })
    try {
      await userService.update(id, data)
      await get().fetchUserById(id)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to update user ${id}` })
      console.error(`Error updating user ${id}:`, err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async deleteUser(id) {
    set({ loading: true, error: null })
    try {
      await userService.delete(id)
      set(state => ({
        users: state.users.filter(u => parseUserId(u.id) !== id),
        currentUser: state.currentUser && parseUserId(state.currentUser.id) === id ? null : state.currentUser,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to delete user ${id}` })
      console.error(`Error deleting user ${id}:`, err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async fetchProfile(userId, authUser) {
    set({ loading: true, error: null })
    try {
      const profile = await userService.getProfile(userId, authUser)
      set({ currentProfile: profile })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch profile' })
      console.error('Error fetching profile:', err)
    } finally {
      set({ loading: false })
    }
  },

  async updateProfile(userId, data) {
    set({ loading: true, error: null })
    try {
      await userService.updateProfile(userId, data)
      await get().fetchProfile(userId)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update profile' })
      console.error('Error updating profile:', err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async fetchSchedule(userId, dateRange) {
    set({ loading: true, error: null })
    try {
      const scheduleData = await userService.getSchedule(userId, dateRange)
      set({ schedule: scheduleData })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch schedule' })
      console.error('Error fetching schedule:', err)
    } finally {
      set({ loading: false })
    }
  },

  async createScheduleSlot(userId, slot) {
    set({ loading: true, error: null })
    try {
      await userService.createScheduleSlot(userId, slot)
      await get().fetchSchedule(userId)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create schedule slot' })
      console.error('Error creating schedule slot:', err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async deleteScheduleSlot(userId, slotId) {
    set({ loading: true, error: null })
    try {
      await userService.deleteScheduleSlot(userId, slotId)
      set(state => ({ schedule: state.schedule.filter(s => s.id !== slotId) }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete schedule slot' })
      console.error('Error deleting schedule slot:', err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async bulkUpdateSchedule(userId, slots) {
    set({ loading: true, error: null })
    try {
      const newSlots = await userService.bulkUpdateSchedule(userId, slots)
      set({ schedule: newSlots })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to bulk update schedule' })
      console.error('Error bulk updating schedule:', err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async nextPage() {
    const { page, totalPages } = get().pagination
    if (page < totalPages) await get().fetchUsers(page + 1)
  },

  async previousPage() {
    const { page } = get().pagination
    if (page > 1) await get().fetchUsers(page - 1)
  },

  async goToPage(page) {
    const { totalPages } = get().pagination
    if (page >= 1 && page <= totalPages) await get().fetchUsers(page)
  },

  async refresh() {
    await get().fetchUsers(get().pagination.page)
  },

  usersByRole: (role) => get().users.filter(u => u.role === role),
  reportingRadiologists: () => get().users.filter(u => u.role === 'reporting-radiologist'),
  validatingRadiologists: () => get().users.filter(u => u.role === 'validating-radiologist'),
  admins: () => get().users.filter(u => u.role === 'admin'),
  userById: (id) => get().users.find(u => u.id === id),
  totalUsers: () => get().pagination.total,
  hasNextPage: () => get().pagination.page < get().pagination.totalPages,
  hasPreviousPage: () => get().pagination.page > 1,

  usersGroupedByRole: () => ({
    admin: get().users.filter(u => u.role === 'admin'),
    'reporting-radiologist': get().users.filter(u => u.role === 'reporting-radiologist'),
    'validating-radiologist': get().users.filter(u => u.role === 'validating-radiologist'),
  }),

  availablePhysicians: () => get().users.filter(u => u.activeStudies < u.maxActiveStudies),
}))
