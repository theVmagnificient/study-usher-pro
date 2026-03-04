import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
import type { PaginatedResult } from '@/services/studyService'


export const useUserStore = defineStore('user', () => {

  const users = ref<Physician[]>([])
  const currentUser = ref<Physician | null>(null)
  const currentProfile = ref<Physician | null>(null)
  const schedule = ref<ScheduleSlot[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  })



  async function fetchUsers(page?: number) {
    loading.value = true
    error.value = null

    try {
      const pageToFetch = page !== undefined ? page : pagination.value.page

      const result = await userService.getAll(pageToFetch, pagination.value.perPage)

      users.value = result.items
      pagination.value = {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchUserById(id: number) {
    loading.value = true
    error.value = null

    try {
      const user = await userService.getById(id)
      currentUser.value = user


      const index = users.value.findIndex((u) => u.id === user.id)
      if (index !== -1) {
        users.value[index] = user
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to fetch user ${id}`
      console.error(`Error fetching user ${id}:`, err)
    } finally {
      loading.value = false
    }
  }


  async function fetchUserByFrontendId(id: string) {
    const backendId = parseUserId(id)
    await fetchUserById(backendId)
  }


  async function createUser(data: UserCreateData) {
    loading.value = true
    error.value = null

    try {
      await userService.create(data)


      await fetchUsers()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create user'
      console.error('Error creating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function updateUser(id: number, data: UserUpdateData) {
    loading.value = true
    error.value = null

    try {
      await userService.update(id, data)


      await fetchUserById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to update user ${id}`
      console.error(`Error updating user ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function deleteUser(id: number) {
    loading.value = true
    error.value = null

    try {
      await userService.delete(id)


      users.value = users.value.filter((u) => parseUserId(u.id) !== id)

      if (currentUser.value && parseUserId(currentUser.value.id) === id) {
        currentUser.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to delete user ${id}`
      console.error(`Error deleting user ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function fetchProfile(userId: number, authUser?: { firstName: string; lastName: string; email: string }) {
    loading.value = true
    error.value = null

    try {
      const profile = await userService.getProfile(userId, authUser)
      currentProfile.value = profile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch profile'
      console.error('Error fetching profile:', err)
    } finally {
      loading.value = false
    }
  }


  async function updateProfile(userId: number, data: ProfileUpdateData) {
    loading.value = true
    error.value = null

    try {
      await userService.updateProfile(userId, data)


      await fetchProfile(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile'
      console.error('Error updating profile:', err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function fetchSchedule(userId: number, dateRange?: DateRange) {
    loading.value = true
    error.value = null

    try {
      const scheduleData = await userService.getSchedule(userId, dateRange)
      schedule.value = scheduleData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch schedule'
      console.error('Error fetching schedule:', err)
    } finally {
      loading.value = false
    }
  }


  async function createScheduleSlot(userId: number, slot: ScheduleSlotData) {
    loading.value = true
    error.value = null

    try {
      await userService.createScheduleSlot(userId, slot)


      await fetchSchedule(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create schedule slot'
      console.error('Error creating schedule slot:', err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function deleteScheduleSlot(userId: number, slotId: number) {
    loading.value = true
    error.value = null

    try {
      await userService.deleteScheduleSlot(userId, slotId)


      schedule.value = schedule.value.filter((s) => s.id !== slotId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete schedule slot'
      console.error('Error deleting schedule slot:', err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function bulkUpdateSchedule(userId: number, slots: ScheduleSlotData[]) {
    loading.value = true
    error.value = null

    try {
      const newSlots = await userService.bulkUpdateSchedule(userId, slots)
      schedule.value = newSlots
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to bulk update schedule'
      console.error('Error bulk updating schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function nextPage() {
    if (pagination.value.page < pagination.value.totalPages) {
      await fetchUsers(pagination.value.page + 1)
    }
  }


  async function previousPage() {
    if (pagination.value.page > 1) {
      await fetchUsers(pagination.value.page - 1)
    }
  }


  async function goToPage(page: number) {
    if (page >= 1 && page <= pagination.value.totalPages) {
      await fetchUsers(page)
    }
  }


  async function refresh() {
    await fetchUsers(pagination.value.page)
  }



  const usersByRole = computed(() => {
    return (role: UserRole) => users.value.filter((u) => u.role === role)
  })


  const reportingRadiologists = computed(() => {
    return users.value.filter((u) => u.role === 'reporting-radiologist')
  })


  const validatingRadiologists = computed(() => {
    return users.value.filter((u) => u.role === 'validating-radiologist')
  })


  const admins = computed(() => {
    return users.value.filter((u) => u.role === 'admin')
  })


  const userById = computed(() => {
    return (id: string) => users.value.find((u) => u.id === id)
  })


  const totalUsers = computed(() => pagination.value.total)


  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)


  const hasPreviousPage = computed(() => pagination.value.page > 1)


  const usersGroupedByRole = computed(() => {
    return {
      admin: users.value.filter((u) => u.role === 'admin'),
      'reporting-radiologist': users.value.filter((u) => u.role === 'reporting-radiologist'),
      'validating-radiologist': users.value.filter((u) => u.role === 'validating-radiologist'),
    }
  })


  const availablePhysicians = computed(() => {
    return users.value.filter((u) => u.activeStudies < u.maxActiveStudies)
  })

  return {

    users,
    currentUser,
    currentProfile,
    schedule,
    loading,
    error,
    pagination,


    fetchUsers,
    fetchUserById,
    fetchUserByFrontendId,
    createUser,
    updateUser,
    deleteUser,
    fetchProfile,
    updateProfile,
    fetchSchedule,
    createScheduleSlot,
    deleteScheduleSlot,
    bulkUpdateSchedule,
    nextPage,
    previousPage,
    goToPage,
    refresh,


    usersByRole,
    reportingRadiologists,
    validatingRadiologists,
    admins,
    userById,
    totalUsers,
    hasNextPage,
    hasPreviousPage,
    usersGroupedByRole,
    availablePhysicians,
  }
})
