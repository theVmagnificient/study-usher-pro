import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Study, StudyStatus, Modality } from '@/types/study'
import { studyService, type StudyFilters } from '@/services/studyService'
import type { ApiError } from '@/lib/api/client'


export const useStudyStore = defineStore('study', () => {

  const studies = ref<Study[]>([])
  const currentStudy = ref<Study | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  })
  const filters = ref<StudyFilters>({})



  async function fetchStudies(newFilters?: StudyFilters, page?: number) {
    loading.value = true
    error.value = null

    try {

      if (newFilters !== undefined) {
        filters.value = newFilters
      }


      const pageToFetch = page !== undefined ? page : pagination.value.page


      const result = await studyService.getAll(filters.value, pageToFetch, pagination.value.perPage)


      studies.value = result.items
      pagination.value = {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch studies'
      console.error('Error fetching studies:', apiError)
    } finally {
      loading.value = false
    }
  }


  async function fetchStudyById(id: string) {
    loading.value = true
    error.value = null

    try {
      const study = await studyService.getById(id)
      currentStudy.value = study


      const index = studies.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        studies.value[index] = study
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || `Failed to fetch study ${id}`
      console.error(`Error fetching study ${id}:`, apiError)
    } finally {
      loading.value = false
    }
  }


  async function triggerProcessing(id: string) {
    loading.value = true
    error.value = null

    try {
      await studyService.triggerProcessing(id)


      await fetchStudyById(id)
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || `Failed to trigger processing for ${id}`
      console.error(`Error triggering processing for ${id}:`, apiError)
    } finally {
      loading.value = false
    }
  }


  async function updateFilters(newFilters: StudyFilters) {
    filters.value = newFilters
    pagination.value.page = 1
    await fetchStudies(newFilters, 1)
  }


  async function nextPage() {
    if (pagination.value.page < pagination.value.totalPages) {
      await fetchStudies(filters.value, pagination.value.page + 1)
    }
  }


  async function previousPage() {
    if (pagination.value.page > 1) {
      await fetchStudies(filters.value, pagination.value.page - 1)
    }
  }


  async function goToPage(page: number) {
    if (page >= 1 && page <= pagination.value.totalPages) {
      await fetchStudies(filters.value, page)
    }
  }


  async function clearFilters() {
    filters.value = {}
    pagination.value.page = 1
    await fetchStudies({}, 1)
  }


  async function refresh() {
    await fetchStudies(filters.value, pagination.value.page)
  }



  const studiesByStatus = computed(() => {
    return (status: StudyStatus) => studies.value.filter((s) => s.status === status)
  })


  const studiesByModality = computed(() => {
    return (modality: Modality) => studies.value.filter((s) => s.modality === modality)
  })


  const studyById = computed(() => {
    return (id: string) => studies.value.find((s) => s.id === id)
  })


  const totalStudies = computed(() => pagination.value.total)


  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)


  const hasPreviousPage = computed(() => pagination.value.page > 1)


  const studiesGroupedByStatus = computed(() => {
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

    studies.value.forEach((study) => {
      grouped[study.status].push(study)
    })

    return grouped
  })

  return {

    studies,
    currentStudy,
    loading,
    error,
    pagination,
    filters,


    fetchStudies,
    fetchStudyById,
    triggerProcessing,
    updateFilters,
    nextPage,
    previousPage,
    goToPage,
    clearFilters,
    refresh,


    studiesByStatus,
    studiesByModality,
    studyById,
    totalStudies,
    hasNextPage,
    hasPreviousPage,
    studiesGroupedByStatus,
  }
})
