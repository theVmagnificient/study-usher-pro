import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuditLogEntry } from '@/types/study'
import type { WorkforceStats, SLAStats } from '@/types/api'
import { auditService, type AuditFilters, type DateRange } from '@/services/auditService'
import type { PaginatedResult } from '@/services/studyService'


export const useAuditStore = defineStore('audit', () => {

  const auditLog = ref<AuditLogEntry[]>([])
  const workforceStats = ref<WorkforceStats | null>(null)
  const slaStats = ref<SLAStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    perPage: 50,
    total: 0,
    totalPages: 0,
  })
  const filters = ref<AuditFilters>({})
  const sortBy = ref<string>('created_at')
  const sortDirection = ref<'asc' | 'desc'>('desc')



  async function fetchAuditLog(newFilters?: AuditFilters, page?: number) {
    loading.value = true
    error.value = null

    try {

      if (newFilters !== undefined) {
        filters.value = newFilters
      }


      const pageToFetch = page !== undefined ? page : pagination.value.page


      const result = await auditService.getAuditLog(
        filters.value,
        pageToFetch,
        pagination.value.perPage,
        sortBy.value,
        sortDirection.value
      )


      auditLog.value = result.items
      pagination.value = {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch audit log'
      console.error('Error fetching audit log:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchWorkforceStats(dateRange?: DateRange) {
    loading.value = true
    error.value = null

    try {
      const stats = await auditService.getWorkforceStats(dateRange)
      workforceStats.value = stats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch workforce statistics'
      console.error('Error fetching workforce statistics:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchSLAStats(dateRange?: DateRange, clientId?: number) {
    loading.value = true
    error.value = null

    try {
      const stats = await auditService.getSLAStats(dateRange, clientId)
      slaStats.value = stats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch SLA statistics'
      console.error('Error fetching SLA statistics:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchStudyAuditLog(studyId: string) {
    loading.value = true
    error.value = null

    try {
      const entries = await auditService.getStudyAuditLog(studyId)
      auditLog.value = entries


      pagination.value = {
        page: 1,
        perPage: entries.length,
        total: entries.length,
        totalPages: 1,
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : `Failed to fetch audit log for study ${studyId}`
      console.error(`Error fetching audit log for study ${studyId}:`, err)
    } finally {
      loading.value = false
    }
  }


  async function fetchUserAuditLog(userId: number) {
    loading.value = true
    error.value = null

    try {
      const entries = await auditService.getUserAuditLog(userId)
      auditLog.value = entries


      pagination.value = {
        page: 1,
        perPage: entries.length,
        total: entries.length,
        totalPages: 1,
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : `Failed to fetch audit log for user ${userId}`
      console.error(`Error fetching audit log for user ${userId}:`, err)
    } finally {
      loading.value = false
    }
  }


  async function updateFilters(newFilters: AuditFilters) {
    filters.value = newFilters
    pagination.value.page = 1
    await fetchAuditLog(newFilters, 1)
  }


  async function updateSort(field: string, direction: 'asc' | 'desc') {
    sortBy.value = field
    sortDirection.value = direction
    pagination.value.page = 1
    await fetchAuditLog(filters.value, 1)
  }


  async function nextPage() {
    if (pagination.value.page < pagination.value.totalPages) {
      await fetchAuditLog(filters.value, pagination.value.page + 1)
    }
  }


  async function previousPage() {
    if (pagination.value.page > 1) {
      await fetchAuditLog(filters.value, pagination.value.page - 1)
    }
  }


  async function goToPage(page: number) {
    if (page >= 1 && page <= pagination.value.totalPages) {
      await fetchAuditLog(filters.value, page)
    }
  }


  async function clearFilters() {
    filters.value = {}
    pagination.value.page = 1
    await fetchAuditLog({}, 1)
  }


  async function refresh() {
    await fetchAuditLog(filters.value, pagination.value.page)
  }


  async function refreshStats(dateRange?: DateRange) {
    await Promise.all([fetchWorkforceStats(dateRange), fetchSLAStats(dateRange)])
  }



  const entriesByStudy = computed(() => {
    return (studyId: string) => auditLog.value.filter((entry) => entry.studyId === studyId)
  })


  const entriesByUser = computed(() => {
    return (userName: string) => auditLog.value.filter((entry) => entry.user === userName)
  })


  const entriesByAction = computed(() => {
    return (action: string) => auditLog.value.filter((entry) => entry.action === action)
  })


  const totalEntries = computed(() => pagination.value.total)


  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)


  const hasPreviousPage = computed(() => pagination.value.page > 1)


  const uniqueActions = computed(() => {
    const actions = new Set(auditLog.value.map((entry) => entry.action))
    return Array.from(actions).sort()
  })


  const uniqueUsers = computed(() => {
    const users = new Set(auditLog.value.map((entry) => entry.user))
    return Array.from(users).sort()
  })


  const entriesGroupedByAction = computed(() => {
    const grouped: Record<string, AuditLogEntry[]> = {}

    auditLog.value.forEach((entry) => {
      if (!grouped[entry.action]) {
        grouped[entry.action] = []
      }
      grouped[entry.action].push(entry)
    })

    return grouped
  })


  const recentActivity = computed(() => {
    return auditLog.value.slice(0, 10)
  })


  const hasWorkforceStats = computed(() => workforceStats.value !== null)


  const hasSLAStats = computed(() => slaStats.value !== null)

  return {

    auditLog,
    workforceStats,
    slaStats,
    loading,
    error,
    pagination,
    filters,
    sortBy,
    sortDirection,


    fetchAuditLog,
    fetchWorkforceStats,
    fetchSLAStats,
    fetchStudyAuditLog,
    fetchUserAuditLog,
    updateFilters,
    updateSort,
    nextPage,
    previousPage,
    goToPage,
    clearFilters,
    refresh,
    refreshStats,


    entriesByStudy,
    entriesByUser,
    entriesByAction,
    totalEntries,
    hasNextPage,
    hasPreviousPage,
    uniqueActions,
    uniqueUsers,
    entriesGroupedByAction,
    recentActivity,
    hasWorkforceStats,
    hasSLAStats,
  }
})
