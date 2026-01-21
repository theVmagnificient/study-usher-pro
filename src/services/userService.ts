import apiClient from '@/lib/api/client'
import type { Physician } from '@/types/study'
import type {
  PaginatedResponse,
  User,
  UserProfile,
  ScheduleSlot,
  Task,
  UserWithDetails,
  UserStats,
  UserProfileWithDetails,
} from '@/types/api'
import { mapUserToPhysician, mapUserWithDetailsToPhysician } from '@/lib/mappers/userMapper'
import { parseUserId } from '@/lib/mappers/utils'
import type { PaginatedResult } from './studyService'

export interface UserCreateData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  role?: string
  specialization?: string
}

export interface UserUpdateData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
}

export interface ProfileUpdateData {
  specialization?: string
  role?: string
}

export interface ScheduleSlotData {
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface DateRange {
  from: Date
  to: Date
}

export const userService = {
  async getAll(page = 1, perPage = 20): Promise<PaginatedResult<Physician>> {
    try {
      const response = await apiClient.get<PaginatedResponse<UserWithDetails>>(
        '/api/v1/admin/users/with-details',
        {
          params: { page, per_page: perPage },
        }
      )

      const physicians = response.data.items.map(mapUserWithDetailsToPhysician)

      return {
        items: physicians,
        total: response.data.total,
        page: response.data.page,
        perPage: response.data.per_page,
        totalPages: response.data.total_pages,
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      throw error
    }
  },

  async getById(id: number): Promise<Physician> {
    try {
      return await this._fetchUserAsPhysician(id)
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error)
      throw error
    }
  },

  async create(data: UserCreateData): Promise<Physician> {
    try {
      const backendData: Record<string, any> = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
      }

      if (data.phone) backendData.phone = data.phone

      const response = await apiClient.post<User>('/api/v1/admin/users', backendData)
      const user = response.data

      if (data.role || data.specialization) {
        await apiClient.patch(`/api/v1/admin/users/${user.id}/profile`, {
          role: data.role,
          specialization: data.specialization,
        })
      }

      return await this._fetchUserAsPhysician(user.id)
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  },

  async update(id: number, data: UserUpdateData): Promise<Physician> {
    try {
      const backendData: Record<string, any> = {}
      if (data.firstName) backendData.first_name = data.firstName
      if (data.lastName) backendData.last_name = data.lastName
      if (data.email) backendData.email = data.email
      if (data.phone) backendData.phone = data.phone

      await apiClient.patch(`/api/v1/admin/users/${id}`, backendData)

      // Update role via profile endpoint if provided
      if (data.role) {
        await apiClient.patch(`/api/v1/admin/users/${id}/profile`, {
          role: data.role,
        })
      }

      return await this._fetchUserAsPhysician(id)
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error)
      throw error
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/users/${id}`)
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error)
      throw error
    }
  },

  async getProfile(userId: number, authUser?: { firstName: string; lastName: string; email: string }): Promise<Physician> {
    try {
      const profileResponse = await apiClient.get<UserProfile>('/api/v1/user/profile')
      const profile = profileResponse.data

      let scheduleSlots: ScheduleSlot[] = []
      try {
        const scheduleResponse = await apiClient.get<ScheduleSlot[]>('/api/v1/user/schedule')
        scheduleSlots = scheduleResponse.data
      } catch (error) {
        console.warn('No schedule found for current user')
      }

      const user: User = {
        id: userId,
        first_name: authUser?.firstName || 'User',
        last_name: authUser?.lastName || '',
        email: authUser?.email || '',
        created_at: '',
        updated_at: '',
      }

      const activeTaskCount = 0

      return mapUserToPhysician({
        user,
        profile,
        scheduleSlots,
        activeTaskCount,
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      throw error
    }
  },

  async updateProfile(userId: number, data: ProfileUpdateData): Promise<void> {
    try {
      await apiClient.put('/api/v1/user/profile', {
        role: data.role,
        specialization: data.specialization,
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  },

  async getSchedule(userId: number, dateRange?: DateRange): Promise<ScheduleSlot[]> {
    try {
      const params: Record<string, any> = {}
      if (dateRange) {
        params.start_date = dateRange.from.toISOString()
        params.end_date = dateRange.to.toISOString()
      }

      const response = await apiClient.get<ScheduleSlot[]>('/api/v1/user/schedule', { params })
      return response.data
    } catch (error) {
      console.error(`Failed to fetch schedule for user ${userId}:`, error)
      throw error
    }
  },

  async createScheduleSlot(userId: number, slot: ScheduleSlotData): Promise<void> {
    try {
      const backendData = {
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: slot.isAvailable,
      }

      await apiClient.post('/api/v1/user/schedule', backendData)
    } catch (error) {
      console.error('Failed to create schedule slot:', error)
      throw error
    }
  },

  async deleteScheduleSlot(userId: number, slotId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/user/schedule/${slotId}`)
    } catch (error) {
      console.error(`Failed to delete schedule slot ${slotId}:`, error)
      throw error
    }
  },

  async bulkUpdateSchedule(userId: number, slots: ScheduleSlotData[]): Promise<ScheduleSlot[]> {
    try {
      const backendData = {
        slots: slots.map(slot => ({
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: slot.isAvailable,
        })),
      }

      const response = await apiClient.put<ScheduleSlot[]>('/api/v1/user/schedule', backendData)
      return response.data
    } catch (error) {
      console.error('Failed to bulk update schedule:', error)
      throw error
    }
  },

  async _fetchUserAsPhysician(userId: number): Promise<Physician> {
    try {
      const userResponse = await apiClient.get<User>(`/api/v1/admin/users/${userId}`)
      const user = userResponse.data

      let profile: UserProfile | undefined
      try {
        const profileResponse = await apiClient.get<UserProfile>(`/api/v1/admin/users/${userId}/profile`)
        profile = profileResponse.data
      } catch (error) {
        console.warn(`No profile found for user ${userId}`)
      }

      let scheduleSlots: ScheduleSlot[] = []
      try {
        const scheduleResponse = await apiClient.get<ScheduleSlot[]>(`/api/v1/admin/users/${userId}/schedule`)
        scheduleSlots = scheduleResponse.data
      } catch (error) {
        console.warn(`No schedule found for user ${userId}`)
      }

      let activeTaskCount = 0
      try {
        const tasksResponse = await apiClient.get<PaginatedResponse<Task>>('/api/v1/admin/tasks', {
          params: {
            reporting_radiologist_id: userId,
            status: 'in_progress',
            per_page: 100,
          },
        })
        activeTaskCount = tasksResponse.data.total
      } catch (error) {
        console.warn(`Failed to fetch active task count for user ${userId}`)
      }

      return mapUserToPhysician({
        user,
        profile,
        scheduleSlots,
        activeTaskCount,
      })
    } catch (error) {
      console.error(`Failed to fetch user as physician for ID ${userId}:`, error)
      throw error
    }
  },

  async getUserStatistics(): Promise<UserStats> {
    try {
      const response = await apiClient.get<UserStats>('/api/v1/user/statistics')
      return response.data
    } catch (error) {
      console.error('Failed to fetch user statistics:', error)
      throw error
    }
  },

  async getProfileWithDetails(userId: number, authUser?: { firstName: string; lastName: string; email: string }): Promise<{
    profile: Physician
    statistics: UserStats
  }> {
    try {
      const response = await apiClient.get<UserProfileWithDetails>('/api/v1/user/profile-with-details')
      const data = response.data

      // Map to UserStats format
      const statistics: UserStats = {
        user_id: data.statistics.user_id,
        total_tasks: data.statistics.total_tasks,
        tasks_this_month: data.statistics.tasks_this_month,
        tasks_last_month: data.statistics.tasks_last_month,
        tasks_by_modality: data.statistics.tasks_by_modality,
        tasks_by_body_area: data.statistics.tasks_by_body_area,
        monthly_tasks_by_modality: data.statistics.monthly_tasks_by_modality,
        monthly_tasks_by_body_area: data.statistics.monthly_tasks_by_body_area,
        average_completion_time_hours: data.statistics.average_completion_time_hours,
        tasks_completed_per_day: data.statistics.tasks_completed_per_day.map(point => ({
          day: point.day,
          value: point.value,
        })),
      }

      // Build user object
      const user: User = {
        id: userId,
        first_name: authUser?.firstName || 'User',
        last_name: authUser?.lastName || '',
        email: authUser?.email || '',
        created_at: '',
        updated_at: '',
      }

      // Build profile object
      const profile: UserProfile = {
        user_id: data.user_id,
        specialization: data.specialization,
        role: data.role,
        created_at: '',
        updated_at: '',
      }

      const activeTaskCount = 0

      // Map to Physician
      const physician = mapUserToPhysician({
        user,
        profile,
        scheduleSlots: data.schedule_slots,
        activeTaskCount,
      })

      return {
        profile: physician,
        statistics,
      }
    } catch (error) {
      console.error('Failed to fetch profile with details:', error)
      throw error
    }
  },
}
