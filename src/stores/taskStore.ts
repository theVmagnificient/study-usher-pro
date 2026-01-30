import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Study, StudyStatus } from '@/types/study'
import { taskService } from '@/services/taskService'
import type { ReportSubmitData } from '@/lib/mappers/reportMapper'


export const useTaskStore = defineStore('task', () => {

  const myReportingTasks = ref<Study[]>([])
  const myValidationTasks = ref<Study[]>([])
  const currentTask = ref<Study | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)


  const currentUserId = ref<number>(1)



  async function fetchMyReportingTasks() {
    loading.value = true
    error.value = null

    try {
      const tasks = await taskService.getMyReportingTasks(currentUserId.value)
      myReportingTasks.value = tasks
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch reporting tasks'
      console.error('Error fetching reporting tasks:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchMyValidationTasks() {
    loading.value = true
    error.value = null

    try {
      const tasks = await taskService.getMyValidationTasks(currentUserId.value)
      myValidationTasks.value = tasks
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch validation tasks'
      console.error('Error fetching validation tasks:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchAdminValidationTasks() {
    loading.value = true
    error.value = null

    try {
      const tasks = await taskService.getAdminValidationTasks()
      myValidationTasks.value = tasks
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch admin validation tasks'
      console.error('Error fetching admin validation tasks:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchTaskDetails(taskId: number) {
    loading.value = true
    error.value = null

    try {
      console.log('Fetching task details for task ID:', taskId)
      const task = await taskService.getTaskDetails(taskId)
      console.log('Fetched task from optimized endpoint:', { id: task.id, hasReport: !!task.report, report: task.report })

      // Directly assign the task to maintain reactivity
      currentTask.value = task
      console.log('After setting currentTask, report is:', currentTask.value?.report)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to fetch task ${taskId}`
      console.error(`Error fetching task ${taskId}:`, err)
    } finally {
      loading.value = false
    }
  }


  async function takeTask(taskId: number) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.takeTask(currentTask.value.taskId, currentUserId.value)


      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to take task ${taskId}`
      console.error(`Error taking task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function startTask(taskId: number) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.startTask(currentTask.value.taskId, currentUserId.value)


      if (currentTask.value) await fetchTaskDetails(currentTask.value.taskId)
      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to start task ${taskId}`
      console.error(`Error starting task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function submitReport(taskId: number, report: ReportSubmitData) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.submitReport(currentTask.value.taskId, report, currentUserId.value)


      if (currentTask.value) await fetchTaskDetails(currentTask.value.taskId)
      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to submit report for ${taskId}`
      console.error(`Error submitting report for ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function assignForValidation(taskId: number) {
    loading.value = true
    error.value = null

    try {
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }

      // Submit for validation - backend will:
      // 1. Auto-translate if status is DRAFT_READY (TODO: add real translation)
      // 2. Auto-assign validator from schedule if available
      // 3. If no validator → stays in TRANSLATED for admin to assign manually
      await taskService.submitForValidation(currentTask.value.taskId)

      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to submit task ${taskId} for validation`
      console.error(`Error submitting task ${taskId} for validation:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function finalizeTask(taskId: number, comment?: string) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.finalizeTask(currentTask.value.taskId, currentUserId.value, comment)


      await fetchMyValidationTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to finalize task ${taskId}`
      console.error(`Error finalizing task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function returnForRevision(taskId: number, comment: string) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.returnForRevision(currentTask.value.taskId, comment, currentUserId.value)


      await fetchMyValidationTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to return task ${taskId}`
      console.error(`Error returning task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function editReportByValidator(taskId: number, updates: {
    protocol?: string
    findings?: string
    impression?: string
    protocol_en?: string
    findings_en?: string
    impression_en?: string
    comment?: string
  }) {
    loading.value = true
    error.value = null

    try {
      await taskService.editReportByValidator(taskId, updates)

      // Refresh validation tasks to reflect the changes
      await fetchMyValidationTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to edit report for task ${taskId}`
      console.error(`Error editing report for task ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function refreshQueues() {
    await Promise.all([fetchMyReportingTasks(), fetchMyValidationTasks()])
  }


  function setCurrentUserId(userId: number) {
    currentUserId.value = userId
  }


  // Note: getValidators removed - врач не выбирает валидатора
  // Система автоматически назначает из расписания
  // Админ использует отдельный endpoint: /api/v1/admin/tasks/{id}/assign-validation


  async function startValidationTask(taskId: number) {
    loading.value = true
    error.value = null

    try {
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.startValidation(currentTask.value.taskId)

      await fetchMyValidationTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to start validation for ${taskId}`
      console.error(`Error starting validation for ${taskId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function markTaskTranslated(taskId: number) {
    loading.value = true
    error.value = null

    try {
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.markTranslated(currentTask.value.taskId)

      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to mark task ${taskId} as translated`
      console.error(`Error marking task ${taskId} as translated:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function markTaskDelivered(taskId: number) {
    loading.value = true
    error.value = null

    try {
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.markDelivered(currentTask.value.taskId)

      // Refresh current task to update status
      if (currentTask.value) await fetchTaskDetails(currentTask.value.taskId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to mark task ${taskId} as delivered`
      console.error(`Error marking task ${taskId} as delivered:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  const pendingReportingTasks = computed(() => {
    return myReportingTasks.value.filter(
      (task) => task.status === 'new' || task.status === 'assigned'
    )
  })


  const inProgressReportingTasks = computed(() => {
    return myReportingTasks.value.filter((task) => task.status === 'in-progress')
  })


  const draftReadyReportingTasks = computed(() => {
    return myReportingTasks.value.filter((task) => task.status === 'draft-ready')
  })


  const returnedTasks = computed(() => {
    return myReportingTasks.value.filter((task) => task.status === 'returned')
  })


  const pendingValidationTasks = computed(() => {
    return myValidationTasks.value.filter((task) => task.status === 'under-validation')
  })


  const totalReportingTasks = computed(() => myReportingTasks.value.length)


  const totalValidationTasks = computed(() => myValidationTasks.value.length)


  const hasActiveTasks = computed(() => {
    return myReportingTasks.value.length > 0 || myValidationTasks.value.length > 0
  })


  const tasksByUrgency = computed(() => {
    const allTasks = [...myReportingTasks.value, ...myValidationTasks.value]
    return {
      stat: allTasks.filter((t) => t.urgency === 'stat'),
      urgent: allTasks.filter((t) => t.urgency === 'urgent'),
      routine: allTasks.filter((t) => t.urgency === 'routine'),
    }
  })


  const reportingTasksByStatus = computed(() => {
    const grouped: Record<StudyStatus, Study[]> = {
      new: [],
      assigned: [],
      'in-progress': [],
      'draft-ready': [],
      translated: [],
      'assigned-for-validation': [],
      'under-validation': [],
      returned: [],
      finalized: [],
      delivered: [],
    }

    myReportingTasks.value.forEach((task) => {
      grouped[task.status].push(task)
    })

    return grouped
  })


  return {

    myReportingTasks,
    myValidationTasks,
    currentTask,
    loading,
    error,
    currentUserId,


    fetchMyReportingTasks,
    fetchMyValidationTasks,
    fetchAdminValidationTasks,
    fetchTaskDetails,
    takeTask,
    startTask,
    submitReport,
    assignForValidation,
    finalizeTask,
    returnForRevision,
    editReportByValidator,
    refreshQueues,
    setCurrentUserId,
    startValidationTask,
    markTaskTranslated,
    markTaskDelivered,


    pendingReportingTasks,
    inProgressReportingTasks,
    draftReadyReportingTasks,
    returnedTasks,
    pendingValidationTasks,
    totalReportingTasks,
    totalValidationTasks,
    hasActiveTasks,
    tasksByUrgency,
    reportingTasksByStatus,
  }
})
