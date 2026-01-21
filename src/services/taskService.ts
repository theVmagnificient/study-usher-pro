import apiClient from '@/lib/api/client'
import type { Study } from '@/types/study'
import type { Task, Study as BackendStudy, ClientType, Client, User, Report, UserWithDetails } from '@/types/api'
import { mapTaskToStudy } from '@/lib/mappers/taskMapper'
import { mapReportSubmit, type ReportSubmitData } from '@/lib/mappers/reportMapper'
import { lookupCache } from '@/lib/cache/lookupCache'
import { parseStudyId } from '@/lib/mappers/utils'


export const taskService = {

  async getMyReportingTasks(): Promise<Study[]> {
    try {
      const response = await apiClient.get<{ items: Task[] }>('/api/v1/tasks', {
        params: { queue: 'reporting' }
      })

      const tasks = response.data.items

      // For list views, use the lighter version that doesn't fetch comments/priors/reports
      const studies: Study[] = []
      for (const task of tasks) {
        const study = await this._fetchTaskAsStudyLight(task)
        studies.push(study)
      }

      return studies
    } catch (error) {
      console.error('Failed to fetch reporting tasks:', error)
      throw error
    }
  },


  async getMyValidationTasks(): Promise<Study[]> {
    try {
      const response = await apiClient.get<{ items: Task[] }>('/api/v1/tasks', {
        params: { queue: 'validation' }
      })

      const tasks = response.data.items

      // For list views, use the lighter version that doesn't fetch comments/priors/reports
      const studies: Study[] = []
      for (const task of tasks) {
        const study = await this._fetchTaskAsStudyLight(task)
        studies.push(study)
      }

      return studies
    } catch (error) {
      console.error('Failed to fetch validation tasks:', error)
      throw error
    }
  },


  async takeTask(taskId: number, userId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/take`)
    } catch (error) {
      console.error(`Failed to take task ${taskId}:`, error)
      throw error
    }
  },


  async startTask(taskId: number, userId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/reporting/start`)
    } catch (error) {
      console.error(`Failed to start task ${taskId}:`, error)
      throw error
    }
  },


  async submitReport(taskId: number, report: ReportSubmitData, userId: number): Promise<void> {
    try {
      const mappedReport = mapReportSubmit(report)
      await apiClient.post(`/api/v1/tasks/${taskId}/reporting/submit`, mappedReport)
    } catch (error) {
      console.error(`Failed to submit report for task ${taskId}:`, error)
      throw error
    }
  },


  async startValidation(taskId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/validation/start`)
    } catch (error) {
      console.error(`Failed to start validation for task ${taskId}:`, error)
      throw error
    }
  },


  async finalizeTask(taskId: number, userId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/validation/approve`)
    } catch (error) {
      console.error(`Failed to finalize task ${taskId}:`, error)
      throw error
    }
  },


  async returnForRevision(taskId: number, comment: string, userId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/validation/reject?comment=${encodeURIComponent(comment)}`)
    } catch (error) {
      console.error(`Failed to return task ${taskId} for revision:`, error)
      throw error
    }
  },


  async markTranslated(taskId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/translation/complete`)
    } catch (error) {
      console.error(`Failed to mark task ${taskId} as translated:`, error)
      throw error
    }
  },


  async submitForValidation(taskId: number, validatingRadiologistId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/validation/submit`, {
        validating_radiologist_id: validatingRadiologistId
      })
    } catch (error) {
      console.error(`Failed to submit task ${taskId} for validation:`, error)
      throw error
    }
  },


  async markDelivered(taskId: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/tasks/${taskId}/delivery/complete`)
    } catch (error) {
      console.error(`Failed to mark task ${taskId} as delivered:`, error)
      throw error
    }
  },


  async getTaskById(taskId: number): Promise<Study> {
    try {
      const response = await apiClient.get<Task>(`/api/v1/tasks/${taskId}`)
      const task = response.data
      return await this._fetchTaskAsStudy(task)
    } catch (error) {
      console.error(`Failed to fetch task ${taskId}:`, error)
      throw error
    }
  },


  async getLatestReport(taskId: number): Promise<Report | null> {
    try {
      const response = await apiClient.get<Report[]>(`/api/v1/reports/task/${taskId}/versions`)
      const reports = response.data
      if (reports.length === 0) {
        return null
      }

      return reports.reduce((latest, current) =>
        current.version > latest.version ? current : latest
      )
    } catch (error) {
      console.error(`Failed to fetch reports for task ${taskId}:`, error)
      return null
    }
  },


  async getTaskByStudyId(studyId: string): Promise<Study> {
    try {
      // Parse study ID (e.g., "STD-001" -> 1) to get the numeric study ID
      const numericStudyId = parseStudyId(studyId)

      // Fetch the study to find its associated task
      const studyResponse = await apiClient.get<BackendStudy>(`/api/v1/studies/${numericStudyId}`)
      const study = studyResponse.data

      // Now fetch all tasks to find which one belongs to this study
      // We need to check both reporting and validation queues
      const [reportingTasks, validationTasks] = await Promise.all([
        apiClient.get<{ items: Task[] }>('/api/v1/tasks', { params: { queue: 'reporting' } }),
        apiClient.get<{ items: Task[] }>('/api/v1/tasks', { params: { queue: 'validation' } })
      ])

      const allTasks = [...reportingTasks.data.items, ...validationTasks.data.items]
      const task = allTasks.find(t => t.study_id === study.id)

      if (!task) {
        throw new Error(`No task found for study ${studyId}`)
      }

      return await this._fetchTaskAsStudy(task)
    } catch (error) {
      console.error(`Failed to fetch task for study ${studyId}:`, error)
      throw error
    }
  },


  async _fetchTaskAsStudyLight(task: Task): Promise<Study> {
    try {
      // Fetch only the essential data for list views
      const studyResponse = await apiClient.get<BackendStudy>(`/api/v1/studies/${task.study_id}`)
      const backendStudy = studyResponse.data

      // Get cached client type and client
      let clientType = lookupCache.getClientType(backendStudy.client_type_id)
      if (!clientType) {
        const clientTypeResponse = await apiClient.get<ClientType>(
          `/api/v1/lookups/types/${backendStudy.client_type_id}`
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

      // Optionally fetch users if needed for the list view
      let reportingUser: User | undefined
      if (task.reporting_radiologist_id) {
        reportingUser = lookupCache.getUser(task.reporting_radiologist_id)
      }

      let validatingUser: User | undefined
      if (task.validating_radiologist_id) {
        validatingUser = lookupCache.getUser(task.validating_radiologist_id)
      }

      // Fetch validator comments for the list view (needed for Commented tab)
      const validatorEvents = await this.getValidatorComments(task.id)

      // Map to Study with validator comments but without prior studies or report
      return mapTaskToStudy({
        task,
        study: backendStudy,
        clientType,
        client,
        reportingUser,
        validatingUser,
        validatorEvents,
      })
    } catch (error) {
      console.error(`Failed to fetch task as study (light) for task ID ${task.id}:`, error)
      throw error
    }
  },

  async _fetchTaskAsStudy(task: Task): Promise<Study> {
    try {

      const studyResponse = await apiClient.get<BackendStudy>(`/api/v1/studies/${task.study_id}`)
      const backendStudy = studyResponse.data


      let clientType = lookupCache.getClientType(backendStudy.client_type_id)
      if (!clientType) {
        const clientTypeResponse = await apiClient.get<ClientType>(
          `/api/v1/lookups/types/${backendStudy.client_type_id}`
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
              `/api/v1/lookups/users/${task.reporting_radiologist_id}`
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
              `/api/v1/lookups/users/${task.validating_radiologist_id}`
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
        this.getValidatorComments(task.id),
        this.getPriorStudies(task.id, 10),
        this.getLatestReport(task.id)
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
      console.error(`Failed to fetch task as study for task ID ${task.id}:`, error)
      throw error
    }
  },


  async getValidators(): Promise<UserWithDetails[]> {
    try {
      const response = await apiClient.get<UserWithDetails[]>('/api/v1/lookups/validators')
      return response.data
    } catch (error) {
      console.error('Failed to fetch validators:', error)
      throw error
    }
  },


  async getAdminValidationTasks(): Promise<Study[]> {
    try {

      const [assignedResponse, underValidationResponse, finalizedResponse] = await Promise.all([
        apiClient.get<{ items: Task[] }>('/api/v1/admin/tasks', {
          params: { status: 'assigned_for_validation', per_page: 100 }
        }),
        apiClient.get<{ items: Task[] }>('/api/v1/admin/tasks', {
          params: { status: 'under_validation', per_page: 100 }
        }),
        apiClient.get<{ items: Task[] }>('/api/v1/admin/tasks', {
          params: { status: 'finalized', per_page: 100 }
        }),
      ])


      const tasks = [
        ...assignedResponse.data.items,
        ...underValidationResponse.data.items,
        ...finalizedResponse.data.items,
      ]

      // For list views, use the lighter version that doesn't fetch comments/priors/reports
      const studies: Study[] = []
      for (const task of tasks) {
        const study = await this._fetchTaskAsStudyLight(task)
        studies.push(study)
      }

      return studies
    } catch (error) {
      console.error('Failed to fetch admin validation tasks:', error)
      throw error
    }
  },


  async getPriorStudies(taskId: number, limit: number = 10): Promise<import('@/types/api').PriorStudy[]> {
    try {
      const response = await apiClient.get<import('@/types/api').PriorStudy[]>(
        `/api/v1/tasks/${taskId}/prior-studies`,
        { params: { limit } }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to fetch prior studies for task ${taskId}:`, error)
      throw error
    }
  },


  async getValidatorComments(taskId: number): Promise<import('@/types/api').TaskEvent[]> {
    try {
      const response = await apiClient.get<import('@/types/api').TaskEvent[]>(
        `/api/v1/tasks/${taskId}/comments`
      )
      return response.data
    } catch (error) {
      console.error(`Failed to fetch validator comments for task ${taskId}:`, error)

      return []
    }
  },
}
