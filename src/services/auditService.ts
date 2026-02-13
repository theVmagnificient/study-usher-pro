import apiClient from '@/lib/api/client'
import type { AuditLogEntry } from '@/types/study'
import type { PaginatedResponse, TaskEvent, TaskEventWithEmbedded, User, WorkforceStats, SLAStats } from '@/types/api'
import { mapTaskEventToAuditLog } from '@/lib/mappers/auditMapper'
import { lookupCache } from '@/lib/lookup/lookupCache'
import type { PaginatedResult } from './studyService'


export interface AuditFilters {
  studyId?: string
  userId?: number
  action?: string
  accessionNumber?: string
  dateFrom?: Date
  dateTo?: Date
}


export interface DateRange {
  from: Date
  to: Date
}


export const auditService = {

  async getAuditLog(
    filters: AuditFilters = {},
    page = 1,
    perPage = 50,
    sortBy = 'created_at',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<AuditLogEntry>> {
    try {

      const params: Record<string, any> = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_direction: sortDirection,
      }


      if (filters.studyId) {


        const backendStudyId = parseInt(filters.studyId.replace('STD-', ''), 10)


        try {
          const tasksResponse = await apiClient.get<PaginatedResponse<import('@/types/api').Task>>(
            '/api/v1/admin/tasks',
            { params: { study_id: backendStudyId, per_page: 1 } }
          )
          if (tasksResponse.data.items.length > 0) {
            params.task_id = tasksResponse.data.items[0].id
          }
        } catch (error) {
          console.warn(`Failed to fetch task for study ${filters.studyId}:`, error)
        }
      }
      if (filters.userId) {
        params.user_id = filters.userId
      }
      if (filters.action) {
        params.action = filters.action
      }
      if (filters.accessionNumber) {
        params.accession_number = filters.accessionNumber
      }
      if (filters.dateFrom) {
        params.start_date = filters.dateFrom.toISOString()
      }
      if (filters.dateTo) {
        params.end_date = filters.dateTo.toISOString()
      }


      const response = await apiClient.get<PaginatedResponse<TaskEventWithEmbedded>>('/api/v1/admin/audit', {
        params,
      })

      const taskEvents = response.data.items

      const auditEntries: AuditLogEntry[] = []

      // Check if backend provides embedded data
      const hasEmbeddedData = taskEvents.length > 0 && taskEvents[0].study_id !== undefined

      // If no embedded data, fall back to fetching (backward compatibility)
      const taskToStudyMap = new Map<number, number>()
      if (!hasEmbeddedData) {
        const taskIds = [...new Set(taskEvents.map(e => e.task_id))]

        for (const taskId of taskIds) {
          try {
            const taskResponse = await apiClient.get<import('@/types/api').Task>(`/api/v1/admin/tasks/${taskId}`)
            taskToStudyMap.set(taskId, taskResponse.data.study_id)
          } catch (error) {
            console.warn(`Failed to fetch task ${taskId}:`, error)
          }
        }
      }

      for (const taskEvent of taskEvents) {
        let user: User | undefined

        // Check if we have embedded user data
        if (taskEvent.user) {
          // Use embedded user data - no API call needed!
          user = {
            ...taskEvent.user,
            created_at: '',
            updated_at: '',
          }
          lookupCache.setUser(user)
        } else if (taskEvent.user_id) {
          // Fallback: check cache or fetch
          user = lookupCache.getUser(taskEvent.user_id)
          if (!user) {
            try {
              const userResponse = await apiClient.get<User>(
                `/api/v1/admin/users/${taskEvent.user_id}`
              )
              user = userResponse.data
              lookupCache.setUser(user)
            } catch (error) {
              console.warn(`Failed to fetch user ${taskEvent.user_id}:`, error)
            }
          }
        }

        // Use embedded study_id if available, otherwise use fetched mapping
        const studyId = taskEvent.study_id || taskToStudyMap.get(taskEvent.task_id) || taskEvent.task_id

        const auditEntry = mapTaskEventToAuditLog({
          taskEvent,
          studyId,
          user,
        })
        auditEntries.push(auditEntry)
      }

      return {
        items: auditEntries,
        total: response.data.total,
        page: response.data.page,
        perPage: response.data.per_page,
        totalPages: response.data.total_pages,
      }
    } catch (error) {
      console.error('Failed to fetch audit log:', error)
      throw error
    }
  },


  async getWorkforceStats(dateRange?: DateRange): Promise<WorkforceStats> {
    try {
      const params: Record<string, any> = {}

      if (dateRange) {
        params.start_date = dateRange.from.toISOString()
        params.end_date = dateRange.to.toISOString()
      }

      const response = await apiClient.get<WorkforceStats>('/api/v1/admin/audit/workforce-stats', {
        params,
      })

      return response.data
    } catch (error) {
      console.error('Failed to fetch workforce statistics:', error)
      throw error
    }
  },


  async getSLAStats(dateRange?: DateRange, clientId?: number): Promise<SLAStats> {
    try {
      const params: Record<string, any> = {}

      if (dateRange) {
        params.start_date = dateRange.from.toISOString()
        params.end_date = dateRange.to.toISOString()
      }

      if (clientId) {
        params.client_id = clientId
      }

      const response = await apiClient.get<SLAStats>('/api/v1/admin/audit/sla-stats', {
        params,
      })

      return response.data
    } catch (error) {
      console.error('Failed to fetch SLA statistics:', error)
      throw error
    }
  },


  async getStudyAuditLog(studyId: string): Promise<AuditLogEntry[]> {
    try {
      const result = await this.getAuditLog({ studyId }, 1, 100)
      return result.items
    } catch (error) {
      console.error(`Failed to fetch audit log for study ${studyId}:`, error)
      throw error
    }
  },


  async getUserAuditLog(userId: number): Promise<AuditLogEntry[]> {
    try {
      const result = await this.getAuditLog({ userId }, 1, 100)
      return result.items
    } catch (error) {
      console.error(`Failed to fetch audit log for user ${userId}:`, error)
      throw error
    }
  },
}
