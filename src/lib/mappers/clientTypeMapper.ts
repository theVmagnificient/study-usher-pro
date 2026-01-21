import type { TaskType, Modality, BodyArea } from '@/types/study'
import type { ClientType, Client } from '@/types/api'
import { formatTaskTypeId, formatBodyArea } from './utils'


export interface ClientTypeToTaskTypeContext {
  clientType: ClientType
  client: Client
}


export function mapClientTypeToTaskType(ctx: ClientTypeToTaskTypeContext): TaskType {
  const { clientType, client } = ctx

  return {
    id: formatTaskTypeId(clientType.id),
    client: client.name,
    modality: mapModality(clientType.modality),
    bodyArea: formatBodyArea(clientType.body_area),
    hasPriors: false,
    expectedTAT: clientType.expected_tat_hours,
    price: clientType.price,
    physicianPayout: clientType.payout,
  }
}


function mapModality(modality: string): Modality {
  if (modality === 'MR') {
    return 'MRI'
  }
  return modality as Modality
}


export function unmapModality(modality: Modality): string {
  if (modality === 'MRI') {
    return 'MR'
  }
  return modality
}
