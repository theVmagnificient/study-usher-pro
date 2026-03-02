import { create } from 'zustand'
import type { TaskType, Modality, BodyArea } from '@/types/study'
import {
  clientTypeService,
  type ClientTypeFilters,
  type ClientTypeCreateData,
  type ClientTypeUpdateData,
} from '@/services/clientTypeService'
import { parseTaskTypeId } from '@/lib/mappers/utils'

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface ClientTypeState {
  clientTypes: TaskType[]
  currentClientType: TaskType | null
  loading: boolean
  error: string | null
  pagination: Pagination
  filters: ClientTypeFilters

  fetchClientTypes: (newFilters?: ClientTypeFilters, page?: number) => Promise<void>
  fetchClientTypeById: (id: number) => Promise<void>
  fetchClientTypeByFrontendId: (id: string) => Promise<void>
  createClientType: (data: ClientTypeCreateData) => Promise<void>
  updateClientType: (id: number, data: ClientTypeUpdateData) => Promise<void>
  deleteClientType: (id: number) => Promise<void>
  updateFilters: (newFilters: ClientTypeFilters) => Promise<void>
  nextPage: () => Promise<void>
  previousPage: () => Promise<void>
  goToPage: (page: number) => Promise<void>
  clearFilters: () => Promise<void>
  refresh: () => Promise<void>

  clientTypesByModality: (modality: Modality) => TaskType[]
  clientTypesByBodyArea: (bodyArea: BodyArea) => TaskType[]
  clientTypesByClient: (clientName: string) => TaskType[]
  clientTypeById: (id: string) => TaskType | undefined
  totalClientTypes: () => number
  hasNextPage: () => boolean
  hasPreviousPage: () => boolean
  clientTypesGroupedByModality: () => Record<string, TaskType[]>
  clientTypesGroupedByClient: () => Record<string, TaskType[]>
  uniqueClients: () => string[]
  uniqueModalities: () => string[]
}

export const useClientTypeStore = create<ClientTypeState>((set, get) => ({
  clientTypes: [],
  currentClientType: null,
  loading: false,
  error: null,
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
  filters: {},

  async fetchClientTypes(newFilters, page) {
    set({ loading: true, error: null })
    try {
      const filters = newFilters !== undefined ? newFilters : get().filters
      if (newFilters !== undefined) set({ filters })
      const pageToFetch = page !== undefined ? page : get().pagination.page
      const result = await clientTypeService.getAll(filters, pageToFetch, get().pagination.perPage)
      set({
        clientTypes: result.items,
        pagination: { page: result.page, perPage: result.perPage, total: result.total, totalPages: result.totalPages },
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch client types' })
      console.error('Error fetching client types:', err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchClientTypeById(id) {
    set({ loading: true, error: null })
    try {
      const clientType = await clientTypeService.getById(id)
      set(state => ({
        currentClientType: clientType,
        clientTypes: state.clientTypes.map(ct => ct.id === clientType.id ? clientType : ct),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to fetch client type ${id}` })
      console.error(`Error fetching client type ${id}:`, err)
    } finally {
      set({ loading: false })
    }
  },

  async fetchClientTypeByFrontendId(id) {
    await get().fetchClientTypeById(parseTaskTypeId(id))
  },

  async createClientType(data) {
    set({ loading: true, error: null })
    try {
      await clientTypeService.create(data)
      await get().fetchClientTypes()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create client type' })
      console.error('Error creating client type:', err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async updateClientType(id, data) {
    set({ loading: true, error: null })
    try {
      await clientTypeService.update(id, data)
      await get().fetchClientTypeById(id)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to update client type ${id}` })
      console.error(`Error updating client type ${id}:`, err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async deleteClientType(id) {
    set({ loading: true, error: null })
    try {
      await clientTypeService.delete(id)
      set(state => ({
        clientTypes: state.clientTypes.filter(ct => parseTaskTypeId(ct.id) !== id),
        currentClientType: state.currentClientType && parseTaskTypeId(state.currentClientType.id) === id ? null : state.currentClientType,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : `Failed to delete client type ${id}` })
      console.error(`Error deleting client type ${id}:`, err)
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async updateFilters(newFilters) {
    set(state => ({ filters: newFilters, pagination: { ...state.pagination, page: 1 } }))
    await get().fetchClientTypes(newFilters, 1)
  },

  async nextPage() {
    const { page, totalPages } = get().pagination
    if (page < totalPages) await get().fetchClientTypes(get().filters, page + 1)
  },

  async previousPage() {
    const { page } = get().pagination
    if (page > 1) await get().fetchClientTypes(get().filters, page - 1)
  },

  async goToPage(page) {
    const { totalPages } = get().pagination
    if (page >= 1 && page <= totalPages) await get().fetchClientTypes(get().filters, page)
  },

  async clearFilters() {
    set(state => ({ filters: {}, pagination: { ...state.pagination, page: 1 } }))
    await get().fetchClientTypes({}, 1)
  },

  async refresh() {
    await get().fetchClientTypes(get().filters, get().pagination.page)
  },

  clientTypesByModality: (modality) => get().clientTypes.filter(ct => ct.modality === modality),
  clientTypesByBodyArea: (bodyArea) => get().clientTypes.filter(ct => ct.bodyArea === bodyArea),
  clientTypesByClient: (clientName) => get().clientTypes.filter(ct => ct.client === clientName),
  clientTypeById: (id) => get().clientTypes.find(ct => ct.id === id),
  totalClientTypes: () => get().pagination.total,
  hasNextPage: () => get().pagination.page < get().pagination.totalPages,
  hasPreviousPage: () => get().pagination.page > 1,
  uniqueClients: () => Array.from(new Set(get().clientTypes.map(ct => ct.client))).sort(),
  uniqueModalities: () => Array.from(new Set(get().clientTypes.map(ct => ct.modality))).sort(),

  clientTypesGroupedByModality: () => {
    const grouped: Record<string, TaskType[]> = {}
    get().clientTypes.forEach(ct => {
      if (!grouped[ct.modality]) grouped[ct.modality] = []
      grouped[ct.modality].push(ct)
    })
    return grouped
  },

  clientTypesGroupedByClient: () => {
    const grouped: Record<string, TaskType[]> = {}
    get().clientTypes.forEach(ct => {
      if (!grouped[ct.client]) grouped[ct.client] = []
      grouped[ct.client].push(ct)
    })
    return grouped
  },
}))
