import type { BodyArea } from '@/types/study'


export function formatStudyId(id: number): string {
  return `STD-${id.toString().padStart(3, '0')}`
}


export function formatUserId(id: number): string {
  return `PHY-${id.toString().padStart(3, '0')}`
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
  const received = new Date(receivedAt)
  received.setHours(received.getHours() + tatHours)
  return received.toISOString()
}


export function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}


export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}


export function parseStudyId(studyId: string): number {
  return parseInt(studyId.replace('STD-', ''), 10)
}


export function parseUserId(userId: string): number {
  return parseInt(userId.replace('PHY-', ''), 10)
}


export function parseTaskTypeId(taskTypeId: string): number {
  return parseInt(taskTypeId.replace('TT-', ''), 10)
}


export function formatPhysicianName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}
