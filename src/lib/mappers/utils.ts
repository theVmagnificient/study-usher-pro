import type { BodyArea } from '@/types/study'


export function formatUserId(id: number): string {
  return id.toString()
}


export function formatTaskTypeId(id: number): string {
  return `TT-${id.toString().padStart(3, '0')}`
}


export function formatBodyArea(bodyArea: string): BodyArea {

  const formatted = bodyArea
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')

  return formatted as BodyArea
}


export function calculateDeadline(receivedAt: string, tatHours: number): string {
  const receivedMs = new Date(receivedAt).getTime()
  const deadlineMs = receivedMs + tatHours * 60 * 60 * 1000
  return new Date(deadlineMs).toISOString()
}


export function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}


export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}


export function parseUserId(userId: string): number {
  return parseInt(userId, 10)
}


export function parseTaskTypeId(taskTypeId: string): number {
  return parseInt(taskTypeId.replace('TT-', ''), 10)
}


export function formatPhysicianName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}
