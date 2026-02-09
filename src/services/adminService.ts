import apiClient from '@/lib/api/client'
import type { ClientType } from '@/types/api'

export interface TaskTypeData {
  client_id: number
  modality: string
  body_area: string
  has_priors: boolean
  expected_tat_hours: number
  price: number
  physician_payout: number
}

export interface ScheduleData {
  days: string[]
  hours: { start: string, end: string }
  custom_schedule?: Record<string, number[]>
}

export interface SLAMetrics {
  total_tasks: number
  on_time: number
  late: number
  average_completion_time: number
  by_urgency: Record<string, { total: number, on_time: number, late: number }>
}

export interface WorkforceMetrics {
  total_physicians: number
  active_physicians: number
  available_capacity: number
  current_workload: number
  by_role: Record<string, { total: number, active: number, capacity: number }>
}

export interface DistributionSettings {
  stat_max_load: number
  urgent_max_load: number
  routine_max_load: number
}

export const adminService = {
  // Task Types Management
  async listTaskTypes(params?: {
    page?: number
    per_page?: number
  }): Promise<{ items: ClientType[], total: number }> {
    try {
      const response = await apiClient.get<{ items: ClientType[], total: number }>(
        '/api/v1/admin/types',
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Failed to list task types:', error)
      throw error
    }
  },

  async createTaskType(data: TaskTypeData): Promise<ClientType> {
    try {
      const response = await apiClient.post<ClientType>('/api/v1/admin/types', data)
      return response.data
    } catch (error) {
      console.error('Failed to create task type:', error)
      throw error
    }
  },

  async updateTaskType(typeId: number, data: Partial<TaskTypeData>): Promise<ClientType> {
    try {
      const response = await apiClient.put<ClientType>(`/api/v1/admin/types/${typeId}`, data)
      return response.data
    } catch (error) {
      console.error(`Failed to update task type ${typeId}:`, error)
      throw error
    }
  },

  async deleteTaskType(typeId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/types/${typeId}`)
    } catch (error) {
      console.error(`Failed to delete task type ${typeId}:`, error)
      throw error
    }
  },

  // Schedule Management
  async getUserSchedule(userId: number): Promise<ScheduleData> {
    try {
      const response = await apiClient.get<ScheduleData>(`/api/v1/admin/users/${userId}/schedule`)
      return response.data
    } catch (error) {
      console.error(`Failed to get schedule for user ${userId}:`, error)
      throw error
    }
  },

  async updateUserSchedule(userId: number, schedule: ScheduleData): Promise<ScheduleData> {
    try {
      const response = await apiClient.put<ScheduleData>(
        `/api/v1/admin/users/${userId}/schedule`,
        schedule
      )
      return response.data
    } catch (error) {
      console.error(`Failed to update schedule for user ${userId}:`, error)
      throw error
    }
  },

  // Statistics & Analytics
  async getSLAMetrics(params?: {
    start_date?: string
    end_date?: string
  }): Promise<SLAMetrics> {
    try {
      const response = await apiClient.get<SLAMetrics>(
        '/api/v1/admin/statistics/sla',
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Failed to get SLA metrics:', error)
      throw error
    }
  },

  async getWorkforceMetrics(): Promise<WorkforceMetrics> {
    try {
      const response = await apiClient.get<WorkforceMetrics>('/api/v1/admin/statistics/workforce')
      return response.data
    } catch (error) {
      console.error('Failed to get workforce metrics:', error)
      throw error
    }
  },

  // Distribution Settings
  async getDistributionSettings(): Promise<DistributionSettings> {
    try {
      const response = await apiClient.get<DistributionSettings>(
        '/api/v1/admin/tasks/distribution-settings'
      )
      return response.data
    } catch (error) {
      console.error('Failed to get distribution settings:', error)
      throw error
    }
  },

  async updateDistributionSettings(data: DistributionSettings): Promise<DistributionSettings> {
    try {
      const response = await apiClient.put<DistributionSettings>(
        '/api/v1/admin/tasks/distribution-settings',
        data
      )
      return response.data
    } catch (error) {
      console.error('Failed to update distribution settings:', error)
      throw error
    }
  },
}
