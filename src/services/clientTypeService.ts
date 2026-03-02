import apiClient from '@/lib/api/client'
import type { TaskType, Modality, BodyArea } from '@/types/study'
import type { PaginatedResponse, ClientType, Client } from '@/types/api'
import { mapClientTypeToTaskType, unmapModality } from '@/lib/mappers/clientTypeMapper'
import { lookupCache } from '@/lib/lookup/lookupCache'
import { parseTaskTypeId } from '@/lib/mappers/utils'
import type { PaginatedResult } from './studyService'
import { BatchLoader } from '@/lib/utils/batchLoader'


export interface ClientTypeFilters {
  client?: string
  modality?: Modality
  bodyArea?: BodyArea
}


export interface ClientTypeCreateData {
  clientId: number
  modality: Modality
  bodyArea: BodyArea
  hasPriors: boolean
  expectedTAT: number
  price: number
  physicianPayout: number
}

export interface ClientTypeUpdateData {
  expectedTAT?: number
  price?: number
  physicianPayout?: number
}


export const clientTypeService = {

  async getAll(
    filters: ClientTypeFilters = {},
    page = 1,
    perPage = 20
  ): Promise<PaginatedResult<TaskType>> {
    try {

      const params: Record<string, any> = {
        page,
        per_page: perPage,
      }


      if (filters.modality) {
        params.modality = unmapModality(filters.modality)
      }
      if (filters.bodyArea) {

        params.body_area = filters.bodyArea.toUpperCase().replace(' ', '_')
      }


      const response = await apiClient.get<PaginatedResponse<ClientType>>('/api/v1/admin/types', {
        params,
      })

      const clientTypes = response.data.items

      // Optimization: Instead of fetching each client type individually,
      // use the data we already have from the list response
      // and only fetch missing client details if needed

      // Cache all client types from the response
      clientTypes.forEach(ct => lookupCache.setClientType(ct))

      // Collect unique client IDs
      const clientIds = [...new Set(clientTypes.map(ct => ct.client_id))]

      // Fetch any missing clients in parallel (most will be cache hits or stubs)
      await Promise.all(
        clientIds.map(async (clientId) => {
          if (!lookupCache.getClient(clientId)) {
            // Create stub client if not in cache
            const client: Client = {
              id: clientId,
              name: `Client ${clientId}`,
              created_at: '',
              updated_at: '',
            }
            lookupCache.setClient(client)
          }
        })
      )

      // Map all client types to task types (no API calls needed)
      const taskTypes: TaskType[] = clientTypes.map(clientType => {
        const client = lookupCache.getClient(clientType.client_id)!
        return mapClientTypeToTaskType({
          clientType,
          client,
        })
      })

      return {
        items: taskTypes,
        total: response.data.total,
        page: response.data.page,
        perPage: response.data.per_page,
        totalPages: response.data.total_pages,
      }
    } catch (error) {
      console.error('Failed to fetch client types:', error)
      throw error
    }
  },


  async getById(id: number): Promise<TaskType> {
    try {
      return await this._fetchClientTypeAsTaskType(id)
    } catch (error) {
      console.error(`Failed to fetch client type ${id}:`, error)
      throw error
    }
  },


  async getByFrontendId(id: string): Promise<TaskType> {
    try {
      const backendId = parseTaskTypeId(id)
      return await this._fetchClientTypeAsTaskType(backendId)
    } catch (error) {
      console.error(`Failed to fetch client type ${id}:`, error)
      throw error
    }
  },


  async create(data: ClientTypeCreateData): Promise<TaskType> {
    try {

      const backendData = {
        client_id: data.clientId,
        modality: unmapModality(data.modality),
        body_area: data.bodyArea.toUpperCase().replace(' ', '_'),
        has_priors: data.hasPriors,
        expected_tat_hours: data.expectedTAT,
        price: data.price,
        payout: data.physicianPayout,
      }

      const response = await apiClient.post<ClientType>('/api/v1/admin/types', backendData)
      const clientType = response.data


      lookupCache.setClientType(clientType)

      return await this._fetchClientTypeAsTaskType(clientType.id)
    } catch (error) {
      console.error('Failed to create client type:', error)
      throw error
    }
  },


  async update(id: number, data: ClientTypeUpdateData): Promise<TaskType> {
    try {

      const backendData: Record<string, any> = {}
      if (data.expectedTAT !== undefined) backendData.expected_tat_hours = data.expectedTAT
      if (data.price !== undefined) backendData.price = data.price
      if (data.physicianPayout !== undefined) backendData.payout = data.physicianPayout

      await apiClient.put(`/api/v1/admin/types/${id}`, backendData)


      lookupCache.clearClientTypes()

      return await this._fetchClientTypeAsTaskType(id)
    } catch (error) {
      console.error(`Failed to update client type ${id}:`, error)
      throw error
    }
  },


  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/types/${id}`)


      lookupCache.clearClientTypes()
    } catch (error) {
      console.error(`Failed to delete client type ${id}:`, error)
      throw error
    }
  },


  async _fetchClientTypeAsTaskType(clientTypeId: number): Promise<TaskType> {
    try {

      let clientType = lookupCache.getClientType(clientTypeId)
      if (!clientType) {
        const response = await apiClient.get<ClientType>(`/api/v1/admin/types/${clientTypeId}`)
        clientType = response.data
        lookupCache.setClientType(clientType)
      }


      let client = lookupCache.getClient(clientType.client_id)
      if (!client) {


        client = {
          id: clientType.client_id,
          name: `Client ${clientType.client_id}`,
          created_at: '',
          updated_at: '',
        }
        lookupCache.setClient(client)
      }


      return mapClientTypeToTaskType({
        clientType,
        client,
      })
    } catch (error) {
      console.error(`Failed to fetch client type as task type for ID ${clientTypeId}:`, error)
      throw error
    }
  },
}
