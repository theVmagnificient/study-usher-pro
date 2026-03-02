import { create } from 'zustand'
import type { Study, StudyStatus, Modality } from '@/types/study'
import { studyService, type StudyFilters } from '@/services/studyService'
import type { ApiError } from '@/lib/api/client'

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface StudyState {
  studies: Study[]
  currentStudy: Study | null
  loading: boolean
  error: string | null
  pagination: Pagination
  filters: StudyFilters

  fetchStudies: (newFilters?: StudyFilters, page?: number) => Promise<void>
  fetchStudyById: (id: string) => Promise<void>
  triggerProcessing: (id: string) => Promise<void>
  updateFilters: (newFilters: StudyFilters) => Promise<void>
  nextPage: () => Promise<void>
  previousPage: () => Promise<void>
  goToPage: (page: number) => Promise<void>
  clearFilters: () => Promise<void>
  refresh: () => Promise<void>

  studiesByStatus: (status: StudyStatus) => Study[]
  studiesByModality: (modality: Modality) => Study[]
  studyById: (id: string) => Study | undefined
  totalStudies: () => number
  hasNextPage: () => boolean
  hasPreviousPage: () => boolean
  studiesGroupedByStatus: () => Record<StudyStatus, Study[]>
}

export const useStudyStore = create<StudyState>((set, get) => ({
  studies: [],
  currentStudy: null,
  loading: false,
  error: null,
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
  filters: {},

  async fetchStudies(newFilters, page) {
    set({ loading: true, error: null })
    try {
      const filters = newFilters !== undefined ? newFilters : get().filters
      if (newFilters !== undefined) set({ filters })
      const pageToFetch = page !== undefined ? page : get().pagination.page
      const result = await studyService.getAll(filters, pageToFetch, get().pagination.perPage)
      set({
        studies: result.items,
        pagination: { page: result.page, perPage: result.perPage, total: result.total, totalPages: result.totalPages },
      })
    } catch (err) {
      set({ error: (err as ApiError).message || 'Failed to fetch studies' })
      console.error('Error fetching studies:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchStudyById(id) {
    set({ loading: true, error: null })
    try {
      const study = await studyService.getById(id)
      set(state => ({
        currentStudy: study,
        studies: state.studies.map(s => s.id === id ? study : s),
      }))
    } catch (err) {
      set({ error: (err as ApiError).message || `Failed to fetch study ${id}` })
      console.error(`Error fetching study ${id}:`, err)
    } finally {
      set({ loading: false })
    }
  },

  async triggerProcessing(id) {
    set({ loading: true, error: null })
    try {
      await studyService.triggerProcessing(id)
      await get().fetchStudyById(id)
    } catch (err) {
      set({ error: (err as ApiError).message || `Failed to trigger processing for ${id}` })
      console.error(`Error triggering processing for ${id}:`, err)
    } finally {
      set({ loading: false })
    }
  },

  async updateFilters(newFilters) {
    set(state => ({ filters: newFilters, pagination: { ...state.pagination, page: 1 } }))
    await get().fetchStudies(newFilters, 1)
  },

  async nextPage() {
    const { page, totalPages } = get().pagination
    if (page < totalPages) await get().fetchStudies(get().filters, page + 1)
  },

  async previousPage() {
    const { page } = get().pagination
    if (page > 1) await get().fetchStudies(get().filters, page - 1)
  },

  async goToPage(page) {
    const { totalPages } = get().pagination
    if (page >= 1 && page <= totalPages) await get().fetchStudies(get().filters, page)
  },

  async clearFilters() {
    set(state => ({ filters: {}, pagination: { ...state.pagination, page: 1 } }))
    await get().fetchStudies({}, 1)
  },

  async refresh() {
    await get().fetchStudies(get().filters, get().pagination.page)
  },

  studiesByStatus: (status) => get().studies.filter(s => s.status === status),
  studiesByModality: (modality) => get().studies.filter(s => s.modality === modality),
  studyById: (id) => get().studies.find(s => s.id === id),
  totalStudies: () => get().pagination.total,
  hasNextPage: () => get().pagination.page < get().pagination.totalPages,
  hasPreviousPage: () => get().pagination.page > 1,

  studiesGroupedByStatus: () => {
    const grouped: Record<StudyStatus, Study[]> = {
      new: [], assigned: [], 'in-progress': [], 'draft-ready': [], translated: [],
      'assigned-for-validation': [], 'under-validation': [], returned: [], finalized: [], delivered: [],
    }
    get().studies.forEach(study => { grouped[study.status].push(study) })
    return grouped
  },
}))
