import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Study, StudyStatus } from '@/types/study'
import { taskService } from '@/services/taskService'
import { parseStudyId } from '@/lib/mappers/utils'
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


  async function fetchTaskByStudyId(studyId: string) {
    loading.value = true
    error.value = null

    try {
      const task = await taskService.getTaskByStudyId(studyId)
      console.log('Fetched task from service:', { id: task.id, hasReport: !!task.report, report: task.report })

      // Directly assign the task to maintain reactivity
      currentTask.value = task
      console.log('After setting currentTask, report is:', currentTask.value?.report)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to fetch task for study ${studyId}`
      console.error(`Error fetching task for study ${studyId}:`, err)
    } finally {
      loading.value = false
    }
  }


  async function takeTask(studyId: string) {
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
      error.value = err instanceof Error ? err.message : `Failed to take task ${studyId}`
      console.error(`Error taking task ${studyId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function startTask(studyId: string) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.startTask(currentTask.value.taskId, currentUserId.value)


      await fetchTaskByStudyId(studyId)
      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to start task ${studyId}`
      console.error(`Error starting task ${studyId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function submitReport(studyId: string, report: ReportSubmitData) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.submitReport(currentTask.value.taskId, report, currentUserId.value)


      await fetchTaskByStudyId(studyId)
      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to submit report for ${studyId}`
      console.error(`Error submitting report for ${studyId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function assignForValidation(studyId: string, validatorId: number) {
    loading.value = true
    error.value = null

    try {
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }

      // First mark the task as translated (workflow requirement)
      await taskService.markTranslated(currentTask.value.taskId)

      // Submit for validation with the selected validator
      await taskService.submitForValidation(currentTask.value.taskId, validatorId)

      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to submit task ${studyId} for validation`
      console.error(`Error submitting task ${studyId} for validation:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function finalizeTask(studyId: string) {
    loading.value = true
    error.value = null

    try {
      // Use the taskId from currentTask instead of parsing studyId
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.finalizeTask(currentTask.value.taskId, currentUserId.value)


      await fetchMyValidationTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to finalize task ${studyId}`
      console.error(`Error finalizing task ${studyId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function returnForRevision(studyId: string, comment: string) {
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
      error.value = err instanceof Error ? err.message : `Failed to return task ${studyId}`
      console.error(`Error returning task ${studyId}:`, err)
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


  async function getValidators() {
    try {
      return await taskService.getValidators()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch validators'
      console.error('Error fetching validators:', err)
      throw err
    }
  }


  async function startValidationTask(studyId: string) {
    loading.value = true
    error.value = null

    try {
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.startValidation(currentTask.value.taskId)

      await fetchMyValidationTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to start validation for ${studyId}`
      console.error(`Error starting validation for ${studyId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function markTaskTranslated(studyId: string) {
    loading.value = true
    error.value = null

    try {
      if (!currentTask.value) {
        throw new Error('No current task loaded')
      }
      await taskService.markTranslated(currentTask.value.taskId)

      await fetchMyReportingTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to mark task ${studyId} as translated`
      console.error(`Error marking task ${studyId} as translated:`, err)
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
    fetchTaskByStudyId,
    takeTask,
    startTask,
    submitReport,
    assignForValidation,
    finalizeTask,
    returnForRevision,
    refreshQueues,
    setCurrentUserId,
    getValidators,
    startValidationTask,
    markTaskTranslated,


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
