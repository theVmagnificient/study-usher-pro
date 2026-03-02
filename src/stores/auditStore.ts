import { create } from 'zustand'
import type { AuditLogEntry } from '@/types/study'
import type { WorkforceStats, SLAStats } from '@/types/api'
import { auditService, type AuditFilters, type DateRange } from '@/services/auditService'

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface AuditState {
  auditLog: AuditLogEntry[]
  workforceStats: WorkforceStats | null
  slaStats: SLAStats | null
  loading: boolean
  error: string | null
  pagination: Pagination
  filters: AuditFilters
  sortBy: string
  sortDirection: 'asc' | 'desc'

  fetchAuditLog: (newFilters?: AuditFilters, page?: number) => Promise<void>
  fetchWorkforceStats: (dateRange?: DateRange) => Promise<void>
  fetchSLAStats: (dateRange?: DateRange, clientId?: number) => Promise<void>
  fetchStudyAuditLog: (studyId: string) => Promise<void>
  fetchUserAuditLog: (userId: number) => Promise<void>
  updateFilters: (newFilters: AuditFilters) => Promise<void>
  updateSort: (field: string, direction: 'asc' | 'desc') => Promise<void>
  nextPage: () => Promise<void>
  previousPage: () => Promise<void>
  goToPage: (page: number) => Promise<void>
  clearFilters: () => Promise<void>
  refresh: () => Promise<void>
  refreshStats: (dateRange?: DateRange) => Promise<void>

  entriesByStudy: (studyId: string) => AuditLogEntry[]
  entriesByUser: (userName: string) => AuditLogEntry[]
  entriesByAction: (action: string) => AuditLogEntry[]
  totalEntries: () => number
  hasNextPage: () => boolean
  hasPreviousPage: () => boolean
  uniqueActions: () => string[]
  uniqueUsers: () => string[]
  entriesGroupedByAction: () => Record<string, AuditLogEntry[]>
  recentActivity: () => AuditLogEntry[]
  hasWorkforceStats: () => boolean
  hasSLAStats: () => boolean
}

export const useAuditStore = create<AuditState>((set, get) => ({
  auditLog: [],
  workforceStats: null,
  slaStats: null,
  loading: false,
  error: null,
  pagination: { page: 1, perPage: 50, total: 0, totalPages: 0 },
  filters: {},
  sortBy: 'created_at',
  sortDirection: 'desc',

  async fetchAuditLog(newFilters, page) {
    set({ loading: true, error: null })
    try {
      const filters = newFilters !== undefined ? newFilters : get().filters
      if (newFilters !== undefined) set({ filters })
      const pageToFetch = page !== undefined ? page : get().pagination.page
      const result = await auditService.getAuditLog(filters, pageToFetch, get().pagination.perPage, get().sortBy, get().sortDirection)
      set({
        auditLog: result.items,
        pagination: { page: result.page, perPage: result.perPage, total: result.total, totalPages: result.totalPages },
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch audit log' })
      console.error('Error fetching audit log:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchWorkforceStats(dateRange) {
    set({ loading: true, error: null })
    try {
      const stats = await auditService.getWorkforceStats(dateRange)
      set({ workforceStats: stats })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch workforce statistics' })
      console.error('Error fetching workforce statistics:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchSLAStats(dateRange, clientId) {
    set({ loading: true, error: null })
    try {
      const stats = await auditService.getSLAStats(dateRange, clientId)
      set({ slaStats: stats })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch SLA statistics' })
      console.error('Error fetching SLA statistics:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchStudyAuditLog(studyId) {
    set({ loading: true, error: null })
    try {
      const entries = await auditService.getStudyAuditLog(studyId)
      set({ auditLog: entries, pagination: { page: 1, perPage: entries.length, total: entries.length, totalPages: 1 } })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to fetch audit log for study ${studyId}` })
      console.error(`Error fetching audit log for study ${studyId}:`, err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchUserAuditLog(userId) {
    set({ loading: true, error: null })
    try {
      const entries = await auditService.getUserAuditLog(userId)
      set({ auditLog: entries, pagination: { page: 1, perPage: entries.length, total: entries.length, totalPages: 1 } })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to fetch audit log for user ${userId}` })
      console.error(`Error fetching audit log for user ${userId}:`, err)
    } finally {
      set({ loading: false })
    }
  },

  async updateFilters(newFilters) {
    set(state => ({ filters: newFilters, pagination: { ...state.pagination, page: 1 } }))
    await get().fetchAuditLog(newFilters, 1)
  },

  async updateSort(field, direction) {
    set(state => ({ sortBy: field, sortDirection: direction, pagination: { ...state.pagination, page: 1 } }))
    await get().fetchAuditLog(get().filters, 1)
  },

  async nextPage() {
    const { page, totalPages } = get().pagination
    if (page < totalPages) await get().fetchAuditLog(get().filters, page + 1)
  },

  async previousPage() {
    const { page } = get().pagination
    if (page > 1) await get().fetchAuditLog(get().filters, page - 1)
  },

  async goToPage(page) {
    const { totalPages } = get().pagination
    if (page >= 1 && page <= totalPages) await get().fetchAuditLog(get().filters, page)
  },

  async clearFilters() {
    set(state => ({ filters: {}, pagination: { ...state.pagination, page: 1 } }))
    await get().fetchAuditLog({}, 1)
  },

  async refresh() {
    await get().fetchAuditLog(get().filters, get().pagination.page)
  },

  async refreshStats(dateRange) {
    await Promise.all([get().fetchWorkforceStats(dateRange), get().fetchSLAStats(dateRange)])
  },

  entriesByStudy: (studyId) => get().auditLog.filter(e => e.studyId === studyId),
  entriesByUser: (userName) => get().auditLog.filter(e => e.user === userName),
  entriesByAction: (action) => get().auditLog.filter(e => e.action === action),
  totalEntries: () => get().pagination.total,
  hasNextPage: () => get().pagination.page < get().pagination.totalPages,
  hasPreviousPage: () => get().pagination.page > 1,
  uniqueActions: () => Array.from(new Set(get().auditLog.map(e => e.action))).sort(),
  uniqueUsers: () => Array.from(new Set(get().auditLog.map(e => e.user))).sort(),
  recentActivity: () => get().auditLog.slice(0, 10),
  hasWorkforceStats: () => get().workforceStats !== null,
  hasSLAStats: () => get().slaStats !== null,

  entriesGroupedByAction: () => {
    const grouped: Record<string, AuditLogEntry[]> = {}
    get().auditLog.forEach(entry => {
      if (!grouped[entry.action]) grouped[entry.action] = []
      grouped[entry.action].push(entry)
    })
    return grouped
  },
}))
