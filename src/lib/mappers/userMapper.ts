import type { Physician, UserRole, Modality, BodyArea } from '@/types/study'
import type { User, UserProfile, ScheduleSlot, UserWithDetails, ScheduleSlotEmbedded } from '@/types/api'
import { formatUserId, formatPhysicianName } from './utils'


export interface UserToPhysicianContext {
  user: User
  profile?: UserProfile
  scheduleSlots?: ScheduleSlot[]
  activeTaskCount?: number
  tasksByModality?: Record<string, number>
  tasksByBodyArea?: Record<string, number>
}


export function mapUserToPhysician(ctx: UserToPhysicianContext): Physician {
  const { user, profile, scheduleSlots = [], activeTaskCount = 0 } = ctx

  return {
    id: formatUserId(user.id),
    fullName: formatPhysicianName(user.first_name, user.last_name),
    phone: user.email, // Use email as contact fallback
    telegram: undefined,
    role: mapUserRole(profile?.role),
    schedule: deriveScheduleFromSlots(scheduleSlots),
    customSchedule: deriveCustomSchedule(scheduleSlots),
    supportedModalities: ['CT', 'MRI'],
    supportedBodyAreas: ['Chest', 'Abdomen'],
    activeStudies: activeTaskCount,
    maxActiveStudies: 5,
    createdAt: user.created_at,
    statistics: {
      total: ctx.tasksByModality ? Object.values(ctx.tasksByModality).reduce((a, b) => a + b, 0) : 0,
      byModality: (ctx.tasksByModality || {}) as Record<Modality, number>,
      byBodyArea: (ctx.tasksByBodyArea || {}) as Record<BodyArea, number>,
    },
  }
}


export function mapUserWithDetailsToPhysician(userData: UserWithDetails): Physician {
  return {
    id: formatUserId(userData.id),
    fullName: formatPhysicianName(userData.first_name, userData.last_name),
    phone: userData.email, // Use email as contact fallback
    telegram: undefined,
    role: mapUserRole(userData.role),
    schedule: deriveScheduleFromEmbeddedSlots(userData.schedule_slots),
    customSchedule: deriveCustomScheduleFromEmbedded(userData.schedule_slots),
    supportedModalities: ['CT', 'MRI'],
    supportedBodyAreas: ['Chest', 'Abdomen'],
    activeStudies: userData.active_task_count,
    maxActiveStudies: 5,
    createdAt: userData.created_at,
    statistics: {
      total: 0,
      byModality: {} as Record<Modality, number>,
      byBodyArea: {} as Record<BodyArea, number>,
    },
  }
}


function mapUserRole(role?: string | null): UserRole {
  if (!role) return 'reporting-radiologist'

  const mapping: Record<string, UserRole> = {
    admin: 'admin',
    reporting_radiologist: 'reporting-radiologist',
    validating_radiologist: 'validating-radiologist',
    // Support both formats (backend may return kebab-case already)
    'reporting-radiologist': 'reporting-radiologist',
    'validating-radiologist': 'validating-radiologist',
  }

  return mapping[role] || 'reporting-radiologist'
}


function deriveScheduleFromSlots(slots: ScheduleSlot[]): {
  days: string[]
  hours: { start: string; end: string }
} {
  if (slots.length === 0) {
    return {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: { start: '09:00', end: '17:00' },
    }
  }


  const daySet = new Set<string>()
  let earliestHour = 23
  let latestHour = 0

  slots.forEach((slot) => {
    const date = new Date(slot.start_time)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    daySet.add(dayName)

    const startHour = date.getHours()
    const endDate = new Date(slot.end_time)
    const endHour = endDate.getHours()

    if (startHour < earliestHour) earliestHour = startHour
    if (endHour > latestHour) latestHour = endHour
  })

  return {
    days: Array.from(daySet),
    hours: {
      start: `${earliestHour.toString().padStart(2, '0')}:00`,
      end: `${latestHour.toString().padStart(2, '0')}:00`,
    },
  }
}


function deriveCustomSchedule(slots: ScheduleSlot[]): Record<string, number[]> | undefined {
  if (slots.length === 0) return undefined

  const customSchedule: Record<string, number[]> = {}

  slots.forEach((slot) => {
    const date = new Date(slot.start_time)
    const dateKey = date.toISOString().split('T')[0]

    const startHour = date.getHours()
    const endDate = new Date(slot.end_time)
    const endHour = endDate.getHours()


    const hours: number[] = []
    for (let h = startHour; h < endHour; h++) {
      hours.push(h)
    }

    if (!customSchedule[dateKey]) {
      customSchedule[dateKey] = hours
    } else {

      customSchedule[dateKey] = [...new Set([...customSchedule[dateKey], ...hours])].sort(
        (a, b) => a - b
      )
    }
  })

  return Object.keys(customSchedule).length > 0 ? customSchedule : undefined
}


export function unmapUserRole(role: UserRole): string {
  const reverseMapping: Record<UserRole, string> = {
    admin: 'admin',
    'reporting-radiologist': 'reporting_radiologist',
    'validating-radiologist': 'validating_radiologist',
  }
  return reverseMapping[role]
}


function deriveScheduleFromEmbeddedSlots(slots: ScheduleSlotEmbedded[]): {
  days: string[]
  hours: { start: string; end: string }
} {
  if (slots.length === 0) {
    return {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: { start: '09:00', end: '17:00' },
    }
  }

  const daySet = new Set<string>()
  let earliestHour = 23
  let latestHour = 0

  slots.forEach((slot) => {
    const date = new Date(slot.start_time)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    daySet.add(dayName)

    const startHour = date.getHours()
    const endDate = new Date(slot.end_time)
    const endHour = endDate.getHours()

    if (startHour < earliestHour) earliestHour = startHour
    if (endHour > latestHour) latestHour = endHour
  })

  return {
    days: Array.from(daySet),
    hours: {
      start: `${earliestHour.toString().padStart(2, '0')}:00`,
      end: `${latestHour.toString().padStart(2, '0')}:00`,
    },
  }
}


function deriveCustomScheduleFromEmbedded(
  slots: ScheduleSlotEmbedded[]
): Record<string, number[]> | undefined {
  if (slots.length === 0) return undefined

  const customSchedule: Record<string, number[]> = {}

  slots.forEach((slot) => {
    const date = new Date(slot.start_time)
    const dateKey = date.toISOString().split('T')[0]

    const startHour = date.getHours()
    const endDate = new Date(slot.end_time)
    const endHour = endDate.getHours()

    const hours: number[] = []
    for (let h = startHour; h < endHour; h++) {
      hours.push(h)
    }

    if (!customSchedule[dateKey]) {
      customSchedule[dateKey] = hours
    } else {
      customSchedule[dateKey] = [...new Set([...customSchedule[dateKey], ...hours])].sort(
        (a, b) => a - b
      )
    }
  })

  return Object.keys(customSchedule).length > 0 ? customSchedule : undefined
}
