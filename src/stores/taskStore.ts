import { create } from 'zustand'
import type { Study, StudyStatus } from '@/types/study'
import { taskService } from '@/services/taskService'
import type { ReportSubmitData } from '@/lib/mappers/reportMapper'

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as any).message
    if (typeof msg === 'string') return msg
    if (Array.isArray(msg)) {
      const texts = msg.map((item: any) => (typeof item?.msg === 'string' ? item.msg : String(item)))
      return texts.join('; ') || fallback
    }
  }
  return fallback
}

function toError(err: unknown, fallback: string): Error {
  return new Error(extractErrorMessage(err, fallback))
}

interface TaskState {
  myReportingTasks: Study[]
  myValidationTasks: Study[]
  currentTask: Study | null
  loading: boolean
  error: string | null
  currentUserId: number

  fetchMyReportingTasks: () => Promise<void>
  fetchMyValidationTasks: () => Promise<void>
  fetchAdminValidationTasks: () => Promise<void>
  fetchTaskDetails: (taskId: number) => Promise<void>
  takeTask: (taskId: number) => Promise<void>
  startTask: (taskId: number) => Promise<void>
  saveDraft: (taskId: number, report: ReportSubmitData) => Promise<void>
  submitReport: (taskId: number, report: ReportSubmitData) => Promise<void>
  assignForValidation: (taskId: number) => Promise<void>
  finalizeTask: (taskId: number, comment?: string) => Promise<void>
  returnForRevision: (taskId: number, comment: string) => Promise<void>
  editReportByValidator: (taskId: number, updates: {
    protocol?: string; findings?: string; impression?: string
    protocol_en?: string; findings_en?: string; impression_en?: string; comment?: string
  }) => Promise<void>
  refreshQueues: () => Promise<void>
  setCurrentUserId: (userId: number) => void
  startValidationTask: (taskId: number) => Promise<void>
  markTaskTranslated: (taskId: number) => Promise<void>
  markTaskDelivered: (taskId: number) => Promise<void>

  // Derived selectors (call as functions)
  pendingReportingTasks: () => Study[]
  inProgressReportingTasks: () => Study[]
  draftReadyReportingTasks: () => Study[]
  returnedTasks: () => Study[]
  pendingValidationTasks: () => Study[]
  totalReportingTasks: () => number
  totalValidationTasks: () => number
  hasActiveTasks: () => boolean
  tasksByUrgency: () => { stat: Study[]; urgent: Study[]; routine: Study[] }
  reportingTasksByStatus: () => Record<StudyStatus, Study[]>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  myReportingTasks: [],
  myValidationTasks: [],
  currentTask: null,
  loading: false,
  error: null,
  currentUserId: 1,

  async fetchMyReportingTasks() {
    set({ loading: true, error: null })
    try {
      const tasks = await taskService.getMyReportingTasks()
      set({ myReportingTasks: tasks })
    } catch (err) {
      set({ error: extractErrorMessage(err, 'Failed to fetch reporting tasks') })
      console.error('Error fetching reporting tasks:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchMyValidationTasks() {
    set({ loading: true, error: null })
    try {
      const tasks = await taskService.getMyValidationTasks()
      set({ myValidationTasks: tasks })
    } catch (err) {
      set({ error: extractErrorMessage(err, 'Failed to fetch validation tasks') })
      console.error('Error fetching validation tasks:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchAdminValidationTasks() {
    set({ loading: true, error: null })
    try {
      const tasks = await taskService.getAdminValidationTasks()
      set({ myValidationTasks: tasks })
    } catch (err) {
      set({ error: extractErrorMessage(err, 'Failed to fetch admin validation tasks') })
      console.error('Error fetching admin validation tasks:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchTaskDetails(taskId) {
    set({ loading: true, error: null })
    try {
      console.log('Fetching task details for task ID:', taskId)
      const task = await taskService.getTaskDetails(taskId)
      console.log('Fetched task from optimized endpoint:', { id: task.id, hasReport: !!task.report, report: task.report })
      set({ currentTask: task })
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to fetch task ${taskId}`) })
      console.error(`Error fetching task ${taskId}:`, err)
    } finally {
      set({ loading: false })
    }
  },

  async takeTask(taskId) {
    set({ loading: true, error: null })
    try {
      const { currentTask, currentUserId } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.takeTask(currentTask.taskId, currentUserId)
      await get().fetchMyReportingTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to take task ${taskId}`) })
      console.error(`Error taking task ${taskId}:`, err)
      throw toError(err, `Failed to take task ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async startTask(taskId) {
    set({ loading: true, error: null })
    try {
      const { currentTask, currentUserId } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.startTask(currentTask.taskId, currentUserId)
      await get().fetchTaskDetails(currentTask.taskId)
      await get().fetchMyReportingTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to start task ${taskId}`) })
      console.error(`Error starting task ${taskId}:`, err)
      throw toError(err, `Failed to start task ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async saveDraft(taskId, report) {
    set({ loading: true, error: null })
    try {
      const { currentTask } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.saveDraft(currentTask.taskId, report)
      await get().fetchTaskDetails(currentTask.taskId)
      await get().fetchMyReportingTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to save draft for ${taskId}`) })
      console.error(`Error saving draft for ${taskId}:`, err)
      throw toError(err, `Failed to save draft for ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async submitReport(taskId, report) {
    set({ loading: true, error: null })
    try {
      const { currentTask, currentUserId } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.submitReport(currentTask.taskId, report, currentUserId)
      await get().fetchTaskDetails(currentTask.taskId)
      await get().fetchMyReportingTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to submit report for ${taskId}`) })
      console.error(`Error submitting report for ${taskId}:`, err)
      throw toError(err, `Failed to submit report for ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async assignForValidation(taskId) {
    set({ loading: true, error: null })
    try {
      const { currentTask } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.submitForValidation(currentTask.taskId)
      await get().fetchMyReportingTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to submit task ${taskId} for validation`) })
      console.error(`Error submitting task ${taskId} for validation:`, err)
      throw toError(err, `Failed to submit task ${taskId} for validation`)
    } finally {
      set({ loading: false })
    }
  },

  async finalizeTask(taskId, comment) {
    set({ loading: true, error: null })
    try {
      const { currentTask, currentUserId } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.finalizeTask(currentTask.taskId, currentUserId, comment)
      await get().fetchMyValidationTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to finalize task ${taskId}`) })
      console.error(`Error finalizing task ${taskId}:`, err)
      throw toError(err, `Failed to finalize task ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async returnForRevision(taskId, comment) {
    set({ loading: true, error: null })
    try {
      const { currentTask, currentUserId } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.returnForRevision(currentTask.taskId, comment, currentUserId)
      await get().fetchMyValidationTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to return task ${taskId}`) })
      console.error(`Error returning task ${taskId}:`, err)
      throw toError(err, `Failed to return task ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async editReportByValidator(taskId, updates) {
    set({ loading: true, error: null })
    try {
      await taskService.editReportByValidator(taskId, updates)
      await get().fetchMyValidationTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to edit report for task ${taskId}`) })
      console.error(`Error editing report for task ${taskId}:`, err)
      throw toError(err, `Failed to edit report for task ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async refreshQueues() {
    await Promise.all([get().fetchMyReportingTasks(), get().fetchMyValidationTasks()])
  },

  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  async startValidationTask(taskId) {
    set({ loading: true, error: null })
    try {
      const { currentTask } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.startValidation(currentTask.taskId)
      await get().fetchMyValidationTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to start validation for ${taskId}`) })
      console.error(`Error starting validation for ${taskId}:`, err)
      throw toError(err, `Failed to start validation for ${taskId}`)
    } finally {
      set({ loading: false })
    }
  },

  async markTaskTranslated(taskId) {
    set({ loading: true, error: null })
    try {
      const { currentTask } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.markTranslated(currentTask.taskId)
      await get().fetchMyReportingTasks()
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to mark task ${taskId} as translated`) })
      console.error(`Error marking task ${taskId} as translated:`, err)
      throw toError(err, `Failed to mark task ${taskId} as translated`)
    } finally {
      set({ loading: false })
    }
  },

  async markTaskDelivered(taskId) {
    set({ loading: true, error: null })
    try {
      const { currentTask } = get()
      if (!currentTask) throw new Error('No current task loaded')
      await taskService.markDelivered(currentTask.taskId)
      if (get().currentTask) await get().fetchTaskDetails(currentTask.taskId)
    } catch (err) {
      set({ error: extractErrorMessage(err, `Failed to mark task ${taskId} as delivered`) })
      console.error(`Error marking task ${taskId} as delivered:`, err)
      throw toError(err, `Failed to mark task ${taskId} as delivered`)
    } finally {
      set({ loading: false })
    }
  },

  // Selectors
  pendingReportingTasks: () => get().myReportingTasks.filter(t => t.status === 'new' || t.status === 'assigned'),
  inProgressReportingTasks: () => get().myReportingTasks.filter(t => t.status === 'in-progress'),
  draftReadyReportingTasks: () => get().myReportingTasks.filter(t => t.status === 'draft-ready'),
  returnedTasks: () => get().myReportingTasks.filter(t => t.status === 'returned'),
  pendingValidationTasks: () => get().myValidationTasks.filter(t => t.status === 'under-validation'),
  totalReportingTasks: () => get().myReportingTasks.length,
  totalValidationTasks: () => get().myValidationTasks.length,
  hasActiveTasks: () => get().myReportingTasks.length > 0 || get().myValidationTasks.length > 0,

  tasksByUrgency: () => {
    const all = [...get().myReportingTasks, ...get().myValidationTasks]
    return {
      stat: all.filter(t => t.urgency === 'stat'),
      urgent: all.filter(t => t.urgency === 'urgent'),
      routine: all.filter(t => t.urgency === 'routine'),
    }
  },

  reportingTasksByStatus: () => {
    const grouped: Record<StudyStatus, Study[]> = {
      new: [], assigned: [], 'in-progress': [], 'draft-saved': [], 'draft-ready': [],
      translated: [], 'assigned-for-validation': [], 'under-validation': [],
      returned: [], finalized: [], delivered: [],
    }
    get().myReportingTasks.forEach(task => { grouped[task.status].push(task) })
    return grouped
  },
}))
