import apiClient from '@/lib/api/client'
import type { Study } from '@/types/study'
import type { Task, TaskWithEmbedded, Study as BackendStudy, ClientType, Client, User, Report, UserWithDetails, TaskDetail, ReportComment, PriorStudy as BackendPriorStudy } from '@/types/api'
import { mapTaskToStudy } from '@/lib/mappers/taskMapper'
import { mapReportSubmit, type ReportSubmitData } from '@/lib/mappers/reportMapper'
import { lookupCache } from '@/lib/lookup/lookupCache'


export const taskService = {

  async getMyReportingTasks(): Promise<Study[]> {
    try {
      const response = await apiClient.get<{ items: TaskWithEmbedded[] }>('/api/v1/tasks', {
        params: { queue: 'reporting' }
      })

      const tasks = response.data.items

      // For list views, use the optimized version with embedded data
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
      const response = await apiClient.get<{ items: TaskWithEmbedded[] }>('/api/v1/tasks', {
        params: { queue: 'validation' }
      })

      const tasks = response.data.items

      // For list views, use the optimized version with embedded data
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


  async saveDraft(taskId: number, report: ReportSubmitData): Promise<void> {
    try {
      const mappedReport = mapReportSubmit(report)
      await apiClient.post(`/api/v1/tasks/${taskId}/reporting/save-draft`, mappedReport)
    } catch (error) {
      console.error(`Failed to save draft for task ${taskId}:`, error)
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


  async finalizeTask(taskId: number, userId: number, comment?: string): Promise<void> {
    try {
      const params = comment ? { comment } : {}
      await apiClient.post(`/api/v1/tasks/${taskId}/validation/approve`, null, { params })
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

  async editReportByValidator(
    taskId: number,
    updates: {
      protocol?: string
      findings?: string
      impression?: string
      protocol_en?: string
      findings_en?: string
      impression_en?: string
      comment?: string
    }
  ): Promise<{ task: Task; report: Report }> {
    try {
      const response = await apiClient.patch(`/api/v1/tasks/${taskId}/validation/edit`, updates)
      return response.data
    } catch (error) {
      console.error(`Failed to edit report for task ${taskId}:`, error)
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


  async submitForValidation(taskId: number): Promise<void> {
    try {
      // No body needed - backend auto-assigns validator from schedule
      // If no validator available, task stays in TRANSLATED for admin to assign
      await apiClient.post(`/api/v1/tasks/${taskId}/validation/submit`)
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



  async _fetchTaskAsStudyLight(task: TaskWithEmbedded): Promise<Study> {
    try {
      // Use embedded data if available (optimized backend response)
      // Otherwise fall back to fetching (backward compatibility)

      let backendStudy: BackendStudy
      let clientType: ClientType
      let reportingUser: User | undefined
      let validatingUser: User | undefined

      // Check if we have embedded study data
      if (task.study) {
        // Use embedded study data - no API call needed!
        // Study is now full object with all DICOM fields
        backendStudy = task.study
      } else {
        // Fallback: fetch study data (backward compatibility)
        const studyResponse = await apiClient.get<BackendStudy>(`/api/v1/studies/${task.study_id}`)
        backendStudy = studyResponse.data
      }

      // Check if we have embedded client type
      if (task.client_type) {
        // Use embedded client type - no API call needed!
        clientType = {
          id: task.client_type.id,
          modality: task.client_type.modality,
          body_area: task.client_type.body_area,
          expected_tat_hours: task.client_type.expected_tat_hours,
          // Fields not included in embedded version
          client_id: backendStudy.client_id,
          has_priors: false,
          price: 0,
          payout: 0,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setClientType(clientType)
      } else {
        // Fallback: fetch or use cached client type
        let cachedClientType = lookupCache.getClientType(backendStudy.client_type_id)
        if (!cachedClientType) {
          const clientTypeResponse = await apiClient.get<ClientType>(
            `/api/v1/lookups/types/${backendStudy.client_type_id}`
          )
          cachedClientType = clientTypeResponse.data
          lookupCache.setClientType(cachedClientType)
        }
        clientType = cachedClientType
      }

      // Get or create client
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

      // Check if we have embedded radiologist data
      if (task.reporting_radiologist) {
        // Use embedded data - no API call needed!
        reportingUser = {
          ...task.reporting_radiologist,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setUser(reportingUser)
      } else if (task.reporting_radiologist_id) {
        // Fallback: use cached user if available
        reportingUser = lookupCache.getUser(task.reporting_radiologist_id)
      }

      if (task.validating_radiologist) {
        // Use embedded data - no API call needed!
        validatingUser = {
          ...task.validating_radiologist,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setUser(validatingUser)
      } else if (task.validating_radiologist_id) {
        // Fallback: use cached user if available
        validatingUser = lookupCache.getUser(task.validating_radiologist_id)
      }

      // Don't fetch validator comments upfront - they'll be loaded on-demand
      // This eliminates N+1 queries for comments (5 tasks = 5 extra requests)

      // Map to Study without validator comments for list view
      return mapTaskToStudy({
        task,
        study: backendStudy,
        clientType,
        client,
        reportingUser,
        validatingUser,
        validatorComments: undefined, // Comments loaded on-demand
      })
    } catch (error) {
      console.error(`Failed to fetch task as study (light) for task ID ${task.id}:`, error)
      throw error
    }
  },

  async _fetchTaskAsStudy(task: TaskWithEmbedded): Promise<Study> {
    try {
      // Use embedded data if available, otherwise fall back to fetching

      let backendStudy: BackendStudy
      let clientType: ClientType
      let reportingUser: User | undefined
      let validatingUser: User | undefined

      // Check if we have embedded study data
      if (task.study) {
        // Study is now full object with all DICOM fields
        backendStudy = task.study
      } else {
        const studyResponse = await apiClient.get<BackendStudy>(`/api/v1/studies/${task.study_id}`)
        backendStudy = studyResponse.data
      }

      // Check if we have embedded client type
      if (task.client_type) {
        clientType = {
          id: task.client_type.id,
          modality: task.client_type.modality,
          body_area: task.client_type.body_area,
          expected_tat_hours: task.client_type.expected_tat_hours,
          client_id: backendStudy.client_id,
          has_priors: false,
          price: 0,
          payout: 0,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setClientType(clientType)
      } else {
        let cachedClientType = lookupCache.getClientType(backendStudy.client_type_id)
        if (!cachedClientType) {
          const clientTypeResponse = await apiClient.get<ClientType>(
            `/api/v1/lookups/types/${backendStudy.client_type_id}`
          )
          cachedClientType = clientTypeResponse.data
          lookupCache.setClientType(cachedClientType)
        }
        clientType = cachedClientType
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

      // Check if we have embedded radiologist data
      if (task.reporting_radiologist) {
        reportingUser = {
          ...task.reporting_radiologist,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setUser(reportingUser)
      } else if (task.reporting_radiologist_id) {
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

      if (task.validating_radiologist) {
        validatingUser = {
          ...task.validating_radiologist,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setUser(validatingUser)
      } else if (task.validating_radiologist_id) {
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
      const [validatorComments, priorStudies, currentReport] = await Promise.all([
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
        validatorComments,
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
      // Fetch all validation statuses in a single request
      // NOTE: 'translated' means ready for admin to assign validator (not shown in validation queue)
      // Validators only see tasks where they are already assigned (assigned_for_validation+)
      const response = await apiClient.get<{ items: TaskWithEmbedded[] }>('/api/v1/admin/tasks', {
        params: {
          status: ['assigned_for_validation', 'under_validation', 'finalized'],
          per_page: 100
        }
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


  async getValidatorComments(taskId: number): Promise<import('@/types/api').ReportComment[]> {
    try {
      const response = await apiClient.get<import('@/types/api').ReportComment[]>(
        `/api/v1/tasks/${taskId}/comments`
      )
      return response.data
    } catch (error) {
      console.error(`Failed to fetch validator comments for task ${taskId}:`, error)

      return []
    }
  },

  async getTaskDetails(taskId: number): Promise<Study> {
    try {
      // Use optimized endpoint that returns everything in one request
      const response = await apiClient.get<TaskDetail>(`/api/v1/tasks/${taskId}/details`)
      const data = response.data

      // Map to Study format
      return mapTaskToStudy({
        task: data.task as any, // The TaskWithEmbedded from backend
        study: data.task.study!, // Study is now full object with all DICOM fields
        clientType: {
          id: data.task.client_type!.id,
          modality: data.task.client_type!.modality,
          body_area: data.task.client_type!.body_area,
          expected_tat_hours: data.task.client_type!.expected_tat_hours,
          client_id: data.task.study!.client_id,
          has_priors: false,
          price: 0,
          payout: 0,
          created_at: '',
          updated_at: '',
        },
        client: {
          id: data.task.study!.client_id,
          name: `Client ${data.task.study!.client_id}`,
          created_at: '',
          updated_at: '',
        },
        reportingUser: data.task.reporting_radiologist ? {
          id: data.task.reporting_radiologist.id,
          first_name: data.task.reporting_radiologist.first_name,
          last_name: data.task.reporting_radiologist.last_name,
          email: data.task.reporting_radiologist.email,
          created_at: '',
          updated_at: '',
        } : undefined,
        validatingUser: data.task.validating_radiologist ? {
          id: data.task.validating_radiologist.id,
          first_name: data.task.validating_radiologist.first_name,
          last_name: data.task.validating_radiologist.last_name,
          email: data.task.validating_radiologist.email,
          created_at: '',
          updated_at: '',
        } : undefined,
        validatorComments: data.validator_comments,
        priorStudies: data.prior_studies as BackendPriorStudy[],
        currentReport: data.latest_report || undefined,
      })
    } catch (error) {
      console.error(`Failed to fetch task details for task ${taskId}:`, error)
      throw error
    }
  },
}
