import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TaskType, Modality, BodyArea } from '@/types/study'
import {
  clientTypeService,
  type ClientTypeFilters,
  type ClientTypeCreateData,
  type ClientTypeUpdateData,
} from '@/services/clientTypeService'
import { parseTaskTypeId } from '@/lib/mappers/utils'
import type { PaginatedResult } from '@/services/studyService'


export const useClientTypeStore = defineStore('clientType', () => {

  const clientTypes = ref<TaskType[]>([])
  const currentClientType = ref<TaskType | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  })
  const filters = ref<ClientTypeFilters>({})



  async function fetchClientTypes(newFilters?: ClientTypeFilters, page?: number) {
    loading.value = true
    error.value = null

    try {

      if (newFilters !== undefined) {
        filters.value = newFilters
      }


      const pageToFetch = page !== undefined ? page : pagination.value.page


      const result = await clientTypeService.getAll(
        filters.value,
        pageToFetch,
        pagination.value.perPage
      )


      clientTypes.value = result.items
      pagination.value = {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch client types'
      console.error('Error fetching client types:', err)
    } finally {
      loading.value = false
    }
  }


  async function fetchClientTypeById(id: number) {
    loading.value = true
    error.value = null

    try {
      const clientType = await clientTypeService.getById(id)
      currentClientType.value = clientType


      const index = clientTypes.value.findIndex((ct) => ct.id === clientType.id)
      if (index !== -1) {
        clientTypes.value[index] = clientType
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to fetch client type ${id}`
      console.error(`Error fetching client type ${id}:`, err)
    } finally {
      loading.value = false
    }
  }


  async function fetchClientTypeByFrontendId(id: string) {
    const backendId = parseTaskTypeId(id)
    await fetchClientTypeById(backendId)
  }


  async function createClientType(data: ClientTypeCreateData) {
    loading.value = true
    error.value = null

    try {
      await clientTypeService.create(data)


      await fetchClientTypes()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create client type'
      console.error('Error creating client type:', err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function updateClientType(id: number, data: ClientTypeUpdateData) {
    loading.value = true
    error.value = null

    try {
      await clientTypeService.update(id, data)


      await fetchClientTypeById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to update client type ${id}`
      console.error(`Error updating client type ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function deleteClientType(id: number) {
    loading.value = true
    error.value = null

    try {
      await clientTypeService.delete(id)


      clientTypes.value = clientTypes.value.filter((ct) => parseTaskTypeId(ct.id) !== id)

      if (currentClientType.value && parseTaskTypeId(currentClientType.value.id) === id) {
        currentClientType.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to delete client type ${id}`
      console.error(`Error deleting client type ${id}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }


  async function updateFilters(newFilters: ClientTypeFilters) {
    filters.value = newFilters
    pagination.value.page = 1
    await fetchClientTypes(newFilters, 1)
  }


  async function nextPage() {
    if (pagination.value.page < pagination.value.totalPages) {
      await fetchClientTypes(filters.value, pagination.value.page + 1)
    }
  }


  async function previousPage() {
    if (pagination.value.page > 1) {
      await fetchClientTypes(filters.value, pagination.value.page - 1)
    }
  }


  async function goToPage(page: number) {
    if (page >= 1 && page <= pagination.value.totalPages) {
      await fetchClientTypes(filters.value, page)
    }
  }


  async function clearFilters() {
    filters.value = {}
    pagination.value.page = 1
    await fetchClientTypes({}, 1)
  }


  async function refresh() {
    await fetchClientTypes(filters.value, pagination.value.page)
  }



  const clientTypesByModality = computed(() => {
    return (modality: Modality) => clientTypes.value.filter((ct) => ct.modality === modality)
  })


  const clientTypesByBodyArea = computed(() => {
    return (bodyArea: BodyArea) => clientTypes.value.filter((ct) => ct.bodyArea === bodyArea)
  })


  const clientTypesByClient = computed(() => {
    return (clientName: string) => clientTypes.value.filter((ct) => ct.client === clientName)
  })


  const clientTypeById = computed(() => {
    return (id: string) => clientTypes.value.find((ct) => ct.id === id)
  })


  const totalClientTypes = computed(() => pagination.value.total)


  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)


  const hasPreviousPage = computed(() => pagination.value.page > 1)


  const clientTypesGroupedByModality = computed(() => {
    const grouped: Record<string, TaskType[]> = {}

    clientTypes.value.forEach((ct) => {
      if (!grouped[ct.modality]) {
        grouped[ct.modality] = []
      }
      grouped[ct.modality].push(ct)
    })

    return grouped
  })


  const clientTypesGroupedByClient = computed(() => {
    const grouped: Record<string, TaskType[]> = {}

    clientTypes.value.forEach((ct) => {
      if (!grouped[ct.client]) {
        grouped[ct.client] = []
      }
      grouped[ct.client].push(ct)
    })

    return grouped
  })


  const uniqueClients = computed(() => {
    const clients = new Set(clientTypes.value.map((ct) => ct.client))
    return Array.from(clients).sort()
  })


  const uniqueModalities = computed(() => {
    const modalities = new Set(clientTypes.value.map((ct) => ct.modality))
    return Array.from(modalities).sort()
  })

  return {

    clientTypes,
    currentClientType,
    loading,
    error,
    pagination,
    filters,


    fetchClientTypes,
    fetchClientTypeById,
    fetchClientTypeByFrontendId,
    createClientType,
    updateClientType,
    deleteClientType,
    updateFilters,
    nextPage,
    previousPage,
    goToPage,
    clearFilters,
    refresh,


    clientTypesByModality,
    clientTypesByBodyArea,
    clientTypesByClient,
    clientTypeById,
    totalClientTypes,
    hasNextPage,
    hasPreviousPage,
    clientTypesGroupedByModality,
    clientTypesGroupedByClient,
    uniqueClients,
    uniqueModalities,
  }
})
