import type { AuditLogEntry, StudyStatus } from '@/types/study'
import type { TaskEventWithEmbedded, User } from '@/types/api'
import { formatPhysicianName } from './utils'
import { mapTaskStatus } from './taskMapper'


export interface TaskEventToAuditContext {
  taskEvent: TaskEventWithEmbedded
  studyId: number
  user?: User
}


export function mapTaskEventToAuditLog(ctx: TaskEventToAuditContext): AuditLogEntry {
  const { taskEvent, studyId, user } = ctx


  console.log('[AuditMapper] Task Event:', {
    task_id: taskEvent.task_id,
    data: taskEvent.data,
    data_type: typeof taskEvent.data,
    old_status: taskEvent.data?.old_status,
    new_status: taskEvent.data?.new_status,
  })


  const action = formatAction(taskEvent.data?.action as string)
  const previousStatus = taskEvent.data?.old_status
    ? mapTaskStatus(taskEvent.data.old_status)
    : undefined
  const newStatus = taskEvent.data?.new_status ? mapTaskStatus(taskEvent.data.new_status) : undefined


  console.log('[AuditMapper] Mapped statuses:', {
    previousStatus,
    newStatus,
  })

  return {
    id: `LOG-${studyId}-${new Date(taskEvent.created_at).getTime()}`,
    studyId: studyId,
    accessionNumber: taskEvent.accession_number,
    action,
    user: user ? formatPhysicianName(user.first_name, user.last_name) : 'System',
    timestamp: taskEvent.created_at,
    previousStatus,
    newStatus,
    comment: taskEvent.comment || undefined,
  }
}


function formatAction(action?: string): string {
  if (!action) return 'Unknown Action'

  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}


export { mapTaskStatus } from './taskMapper'
