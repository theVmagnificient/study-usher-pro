import apiClient from '@/lib/api/client'
import type { Study, StudyStatus, Modality } from '@/types/study'
import type {
  PaginatedResponse,
  Study as BackendStudy,
  Task,
  TaskWithEmbedded,
  ClientType,
  Client,
  User,
  TaskEvent,
  PriorStudy,
} from '@/types/api'
import { mapTaskToStudy } from '@/lib/mappers/taskMapper'
import { lookupCache } from '@/lib/cache/lookupCache'
import { requestDeduplicator, createRequestKey } from '@/lib/utils/requestDeduplication'


export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}


export interface StudyFilters {
  status?: StudyStatus
  client?: string
  modality?: Modality
  dateFrom?: Date
  dateTo?: Date
}


export const studyService = {

  async getAll(
    filters: StudyFilters = {},
    page = 1,
    perPage = 20
  ): Promise<PaginatedResult<Study>> {

    const params: Record<string, any> = {
      page,
      per_page: perPage,
    }


    if (filters.status) {
      params.status = filters.status
    }
    if (filters.client) {
      params.client = filters.client
    }
    if (filters.modality) {
      params.modality = filters.modality
    }
    if (filters.dateFrom) {
      params.date_from = filters.dateFrom.toISOString()
    }
    if (filters.dateTo) {
      params.date_to = filters.dateTo.toISOString()
    }


    const requestKey = createRequestKey('/api/v1/admin/studies', params)


    return requestDeduplicator.dedupe(requestKey, async () => {
      try {

        const response = await apiClient.get<PaginatedResponse<BackendStudy>>(
          '/api/v1/admin/studies',
          { params }
        )

        const backendStudies = response.data.items

        if (backendStudies.length === 0) {
          return {
            items: [],
            total: response.data.total,
            page: response.data.page,
            perPage: response.data.per_page,
            totalPages: response.data.total_pages,
          }
        }

        // Fetch all tasks in bulk
        const studyIds = backendStudies.map(s => s.id)
        const tasksMap = await this._fetchTasksBulk(studyIds)

        // Collect unique client type IDs and user IDs
        const clientTypeIds = new Set<number>()
        const userIds = new Set<number>()

        backendStudies.forEach(study => {
          clientTypeIds.add(study.client_type_id)
          const task = tasksMap.get(study.id)
          if (task?.reporting_radiologist_id) {
            userIds.add(task.reporting_radiologist_id)
          }
          if (task?.validating_radiologist_id) {
            userIds.add(task.validating_radiologist_id)
          }
        })

        // Fetch client types and users that aren't cached
        await this._prefetchClientTypes(Array.from(clientTypeIds))
        await this._prefetchUsers(Array.from(userIds))

        // Map studies with their relations (no additional API calls needed)
        const studies: Study[] = []
        for (const backendStudy of backendStudies) {
          const task = tasksMap.get(backendStudy.id)
          if (!task) {
            console.warn(`No task found for study ${backendStudy.id}`)
            continue
          }

          const study = await this._mapStudyWithRelationsCached(backendStudy, task)
          studies.push(study)
        }

        return {
          items: studies,
          total: response.data.total,
          page: response.data.page,
          perPage: response.data.per_page,
          totalPages: response.data.total_pages,
        }
      } catch (error) {
        console.error('Failed to fetch studies:', error)
        throw error
      }
    })
  },


  async getById(id: string): Promise<Study> {
    try {

      const backendId = parseInt(id.replace('STD-', ''), 10)
      return await this._fetchStudyWithRelations(backendId)
    } catch (error) {
      console.error(`Failed to fetch study ${id}:`, error)
      throw error
    }
  },


  async _fetchTasksBulk(studyIds: number[]): Promise<Map<number, Task>> {
    try {
      // Fetch all tasks for the given study IDs in one request
      // The API now returns TaskWithEmbedded which includes embedded client types and users
      const response = await apiClient.get<PaginatedResponse<TaskWithEmbedded>>('/api/v1/admin/tasks', {
        params: { per_page: 100 }
      })

      const tasksMap = new Map<number, Task>()
      response.data.items.forEach(task => {
        if (task.study_id && studyIds.includes(task.study_id)) {
          // Only add if we don't already have a task for this study
          // (tasks are returned newest first, so first match is the latest task)
          if (!tasksMap.has(task.study_id)) {
            // Populate cache with embedded data to avoid additional API calls
            if (task.client_type) {
              lookupCache.setClientType({
                id: task.client_type.id,
                modality: task.client_type.modality,
                body_area: task.client_type.body_area,
                expected_tat_hours: task.client_type.expected_tat_hours,
                client_id: task.study?.client_id || 0,
                price: 0,
                payout: 0,
                created_at: '',
                updated_at: '',
              })
            }

            if (task.reporting_radiologist) {
              lookupCache.setUser({
                id: task.reporting_radiologist.id,
                first_name: task.reporting_radiologist.first_name,
                last_name: task.reporting_radiologist.last_name,
                email: task.reporting_radiologist.email,
                created_at: '',
                updated_at: '',
              })
            }

            if (task.validating_radiologist) {
              lookupCache.setUser({
                id: task.validating_radiologist.id,
                first_name: task.validating_radiologist.first_name,
                last_name: task.validating_radiologist.last_name,
                email: task.validating_radiologist.email,
                created_at: '',
                updated_at: '',
              })
            }

            tasksMap.set(task.study_id, task as Task)
          }
        }
      })

      return tasksMap
    } catch (error) {
      console.error('Failed to fetch tasks in bulk:', error)
      return new Map()
    }
  },


  async _prefetchClientTypes(clientTypeIds: number[]): Promise<void> {
    const missingIds = clientTypeIds.filter(id => !lookupCache.getClientType(id))

    if (missingIds.length === 0) return

    try {
      // Fetch missing client types one by one (could be optimized if API supports bulk fetch)
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const response = await apiClient.get<ClientType>(`/api/v1/admin/types/${id}`)
            lookupCache.setClientType(response.data)
          } catch (error) {
            console.warn(`Failed to prefetch client type ${id}:`, error)
          }
        })
      )
    } catch (error) {
      console.error('Failed to prefetch client types:', error)
    }
  },


  async _prefetchUsers(userIds: number[]): Promise<void> {
    const missingIds = userIds.filter(id => !lookupCache.getUser(id))

    if (missingIds.length === 0) return

    try {
      // Fetch missing users in parallel
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const response = await apiClient.get<User>(`/api/v1/admin/users/${id}`)
            lookupCache.setUser(response.data)
          } catch (error) {
            console.warn(`Failed to prefetch user ${id}:`, error)
          }
        })
      )
    } catch (error) {
      console.error('Failed to prefetch users:', error)
    }
  },


  async _mapStudyWithRelationsCached(backendStudy: BackendStudy, task: Task): Promise<Study> {
    try {
      // Get data from cache (all should be pre-fetched)
      const clientType = lookupCache.getClientType(backendStudy.client_type_id)
      if (!clientType) {
        throw new Error(`Client type ${backendStudy.client_type_id} not found in cache`)
      }

      let client = lookupCache.getClient(backendStudy.client_id)
      if (!client) {
        client = {
          id: backendStudy.client_id,
          name: `Client ${backendStudy.client_id}`,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setClient(client)
      }

      const reportingUser = task.reporting_radiologist_id
        ? lookupCache.getUser(task.reporting_radiologist_id)
        : undefined

      const validatingUser = task.validating_radiologist_id
        ? lookupCache.getUser(task.validating_radiologist_id)
        : undefined

      // Skip fetching comments, prior studies, and report for list view - they're not displayed
      const validatorEvents: TaskEvent[] = []
      const priorStudies: PriorStudy[] = []
      const currentReport = undefined

      return mapTaskToStudy({
        task,
        study: backendStudy,
        clientType,
        client,
        reportingUser,
        validatingUser,
        validatorEvents,
        priorStudies,
        currentReport,
      })
    } catch (error) {
      console.error(`Failed to map study with cached relations for ID ${backendStudy.id}:`, error)
      throw error
    }
  },


  async triggerProcessing(id: string): Promise<void> {
    try {
      const backendId = parseInt(id.replace('STD-', ''), 10)
      await apiClient.post(`/api/v1/admin/studies/${backendId}/trigger-processing`)
    } catch (error) {
      console.error(`Failed to trigger processing for study ${id}:`, error)
      throw error
    }
  },


  async reassignTask(taskId: number, radiologistId: number, comment?: string): Promise<void> {
    try {
      await apiClient.post(`/api/v1/admin/tasks/${taskId}/reassign`, {
        radiologist_id: radiologistId,
        comment: comment || 'Reassigned by admin',
      })
    } catch (error) {
      console.error(`Failed to reassign task ${taskId}:`, error)
      throw error
    }
  },


  async assignReportingRadiologist(taskId: number, radiologistId: number, comment?: string): Promise<void> {
    try {
      await apiClient.post(`/api/v1/admin/tasks/${taskId}/assign-reporting`, {
        radiologist_id: radiologistId,
        comment: comment || 'Assigned by admin',
      })
    } catch (error) {
      console.error(`Failed to assign reporting radiologist to task ${taskId}:`, error)
      throw error
    }
  },


  async assignValidatingRadiologist(taskId: number, radiologistId: number, comment?: string): Promise<void> {
    try {
      await apiClient.post(`/api/v1/admin/tasks/${taskId}/assign-validation`, {
        radiologist_id: radiologistId,
        comment: comment || 'Assigned for validation by admin',
      })
    } catch (error) {
      console.error(`Failed to assign validating radiologist to task ${taskId}:`, error)
      throw error
    }
  },


  async _mapStudyWithRelations(backendStudy: BackendStudy): Promise<Study> {
    try {


      const taskResponse = await apiClient.get<PaginatedResponse<Task>>('/api/v1/admin/tasks', {
        params: { study_id: backendStudy.id, per_page: 1 },
      })

      if (taskResponse.data.items.length === 0) {
        throw new Error(`No task found for study ${backendStudy.id}`)
      }

      const task = taskResponse.data.items[0]


      let clientType = lookupCache.getClientType(backendStudy.client_type_id)
      if (!clientType) {
        const clientTypeResponse = await apiClient.get<ClientType>(
          `/api/v1/admin/types/${backendStudy.client_type_id}`
        )
        clientType = clientTypeResponse.data
        lookupCache.setClientType(clientType)
      }


      let client = lookupCache.getClient(backendStudy.client_id)
      if (!client) {


        client = {
          id: backendStudy.client_id,
          name: `Client ${backendStudy.client_id}`,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setClient(client)
      }


      let reportingUser: User | undefined
      if (task.reporting_radiologist_id) {
        reportingUser = lookupCache.getUser(task.reporting_radiologist_id)
        if (!reportingUser) {
          try {
            const userResponse = await apiClient.get<User>(
              `/api/v1/admin/users/${task.reporting_radiologist_id}`
            )
            reportingUser = userResponse.data
            lookupCache.setUser(reportingUser)
          } catch (error) {
            console.warn(`Failed to fetch user ${task.reporting_radiologist_id}:`, error)
          }
        }
      }


      let validatingUser: User | undefined
      if (task.validating_radiologist_id) {
        validatingUser = lookupCache.getUser(task.validating_radiologist_id)
        if (!validatingUser) {
          try {
            const userResponse = await apiClient.get<User>(
              `/api/v1/admin/users/${task.validating_radiologist_id}`
            )
            validatingUser = userResponse.data
            lookupCache.setUser(validatingUser)
          } catch (error) {
            console.warn(`Failed to fetch user ${task.validating_radiologist_id}:`, error)
          }
        }
      }


      // Fetch validator comments, prior studies, and current report in parallel
      const [validatorEvents, priorStudies, currentReport] = await Promise.all([
        this._getValidatorComments(task.id),
        this._getPriorStudies(task.id, 10),
        this._getLatestReport(task.id)
      ])


      return mapTaskToStudy({
        task,
        study: backendStudy,
        clientType,
        client,
        reportingUser,
        validatingUser,
        validatorEvents,
        priorStudies,
        currentReport: currentReport || undefined,
      })
    } catch (error) {
      console.error(`Failed to map study with relations for ID ${backendStudy.id}:`, error)
      throw error
    }
  },


  async _fetchStudyWithRelations(studyId: number): Promise<Study> {
    try {
      const studyResponse = await apiClient.get<BackendStudy>(`/api/v1/admin/studies/${studyId}`)
      const backendStudy = studyResponse.data
      return await this._mapStudyWithRelations(backendStudy)
    } catch (error) {
      console.error(`Failed to fetch study with relations for ID ${studyId}:`, error)
      throw error
    }
  },


  async _getValidatorComments(taskId: number): Promise<TaskEvent[]> {
    try {
      const response = await apiClient.get<TaskEvent[]>(
        `/api/v1/tasks/${taskId}/comments`
      )
      return response.data
    } catch (error) {
      console.error(`Failed to fetch validator comments for task ${taskId}:`, error)

      return []
    }
  },

  async _getPriorStudies(taskId: number, limit: number = 10): Promise<PriorStudy[]> {
    try {
      const response = await apiClient.get<PriorStudy[]>(
        `/api/v1/tasks/${taskId}/prior-studies`,
        { params: { limit } }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to fetch prior studies for task ${taskId}:`, error)
      return []
    }
  },

  async _getLatestReport(taskId: number): Promise<import('@/types/api').Report | null> {
    try {
      const response = await apiClient.get<import('@/types/api').Report[]>(
        `/api/v1/reports/task/${taskId}/versions`
      )
      const reports = response.data
      if (reports.length === 0) {
        return null
      }
      // Return the latest version
      return reports.reduce((latest, current) =>
        current.version > latest.version ? current : latest
      )
    } catch (error) {
      console.error(`Failed to fetch report for task ${taskId}:`, error)
      return null
    }
  },
}
