import type { Study, StudyStatus, Urgency, Modality, ValidatorComment, PriorStudy, AuditLogEntry } from '@/types/study'
import type {
  Task,
  Study as BackendStudy,
  ClientType,
  User,
  Client,
  TaskStatus as BackendTaskStatus,
  TaskEvent,
  TaskEventWithEmbedded,
  PriorStudy as BackendPriorStudy,
} from '@/types/api'
import {
  formatBodyArea,
  calculateDeadline,
  formatPhysicianName,
} from './utils'


export interface TaskToStudyContext {
  task: Task
  study: BackendStudy
  clientType: ClientType
  client: Client
  reportingUser?: User
  validatingUser?: User
  validatorEvents?: TaskEventWithEmbedded[]
  priorStudies?: BackendPriorStudy[]
  currentReport?: import('@/types/api').Report
}


function mapPriorStudy(backendPrior: BackendPriorStudy): PriorStudy {
  // Create a descriptive type from modality and body area
  const type = `${mapModality(backendPrior.modality)} ${formatBodyArea(backendPrior.body_area)}`

  // Extract report sections - both Russian and English versions
  let protocol: string | undefined
  let protocolEn: string | undefined
  let findings: string | undefined
  let findingsEn: string | undefined
  let impression: string | undefined
  let impressionEn: string | undefined
  let reportText: string | undefined

  if (backendPrior.report) {
    protocol = backendPrior.report.protocol || undefined
    protocolEn = backendPrior.report.protocol_en || undefined
    findings = backendPrior.report.findings || undefined
    findingsEn = backendPrior.report.findings_en || undefined
    impression = backendPrior.report.impression || undefined
    impressionEn = backendPrior.report.impression_en || undefined
    reportText = backendPrior.report.report_text || undefined
  }

  return {
    id: backendPrior.study_id, // Study ID (numeric)
    type,
    date: backendPrior.study_datetime,
    protocol,
    protocolEn,
    findings,
    findingsEn,
    impression,
    impressionEn,
    reportText,
  }
}


export function mapTaskToStudy(ctx: TaskToStudyContext): Study {
  const { task, study, clientType, client, reportingUser, validatingUser, validatorEvents, priorStudies, currentReport } = ctx


  // Validator comments - include comments from validator when returning, editing, or finalizing
  const validatorComments: ValidatorComment[] | undefined = validatorEvents
    ?.filter(event => {
      const action = event.data?.action
      // Include validator actions with meaningful content
      return (
        (action === 'task_report_returned_for_revision' && event.comment) ||
        (action === 'task_report_edited_by_validator') ||
        (action === 'task_report_finalized' && event.comment)
      )
    })
    .map((event, index) => ({
      id: `${task.id}-${index}`,
      text: formatTaskEventMessage(event),
      validatorName: event.user
        ? formatPhysicianName(event.user.first_name, event.user.last_name)
        : 'Unknown Validator',
      timestamp: event.created_at,
      isCritical: event.data?.action === 'task_report_returned_for_revision',
      isAction: event.data?.action === 'task_report_edited_by_validator',
      isNonCritical: event.data?.action === 'task_report_finalized',
    }))

  // Get validator comments count from embedded data if available, otherwise use array length
  const taskWithEmbedded = task as import('@/types/api').TaskWithEmbedded
  const validatorCommentsCount = taskWithEmbedded.validator_comments_count ?? validatorComments?.length ?? 0

  // Map ALL events to audit log entries - using the same validatorEvents source
  const auditLog: AuditLogEntry[] | undefined = validatorEvents?.map((event, index) => {
    const action = event.data?.action
    const oldStatus = event.data?.old_status
    const newStatus = event.data?.new_status

    return {
      id: `${task.id}-event-${index}`,
      studyId: event.study_id ?? study.id,
      action: formatTaskEventMessage(event),
      user: event.user
        ? formatPhysicianName(event.user.first_name, event.user.last_name)
        : 'System',
      timestamp: event.created_at,
      previousStatus: oldStatus ? mapTaskStatus(oldStatus) : undefined,
      newStatus: newStatus ? mapTaskStatus(newStatus) : undefined,
      comment: event.comment ?? undefined,
    }
  })

  // Map prior studies from backend format to frontend format
  const mappedPriorStudies = priorStudies?.map(mapPriorStudy)

  // Map current report if available
  let report: Study['report'] | undefined
  if (currentReport) {
    report = {
      protocol: currentReport.protocol ?? '',
      protocolEn: currentReport.protocol_en ?? '',
      findings: currentReport.findings ?? '',
      findingsEn: currentReport.findings_en ?? '',
      impression: currentReport.impression ?? '',
      impressionEn: currentReport.impression_en ?? '',
    }
  }

  // Determine which physician to show based on task status
  const status = mapTaskStatus(task.status)
  const isValidationStatus = status === 'assigned-for-validation' || status === 'under-validation'

  const assignedPhysician = isValidationStatus
    ? (validatingUser ? formatPhysicianName(validatingUser.first_name, validatingUser.last_name) : undefined)
    : (reportingUser ? formatPhysicianName(reportingUser.first_name, reportingUser.last_name) : undefined)

  return {
    id: task.id, // Task ID (numeric) - used for navigation and API calls
    taskId: task.id, // Kept for backward compatibility
    studyId: study.id, // Study ID (numeric) from database
    patientId: study.patient_id,
    clientName: client.name,
    status,
    urgency: mapTaskUrgency(task.urgency),
    modality: mapModality(clientType.modality),
    bodyArea: formatBodyArea(clientType.body_area),
    assignedPhysician,
    receivedAt: study.study_datetime,
    deadline: calculateDeadline(study.study_datetime, clientType.expected_tat_hours),
    hasPriors: mappedPriorStudies ? mappedPriorStudies.length > 0 : false,
    priorCount: mappedPriorStudies?.length,
    priorStudies: mappedPriorStudies,
    sex: study.patient_sex,
    age: study.patient_age,
    description: study.description,
    accessionNumber: study.accession_number,
    clinicalNotes: task.clinical_notes || '',
    technicalNotes: task.technical_notes || '',
    validatorCommentsCount,
    validatorComments,
    auditLog,
    report,
  }
}


export function mapTaskStatus(status: BackendTaskStatus): StudyStatus {
  const mapping: Record<BackendTaskStatus, StudyStatus> = {
    integrity_validation: 'new',
    new: 'new',
    assigned: 'assigned',
    in_progress: 'in-progress',
    draft_ready: 'draft-ready',
    translated: 'translated',
    assigned_for_validation: 'assigned-for-validation',
    under_validation: 'under-validation',
    returned_for_revision: 'returned',
    finalized: 'finalized',
    delivered: 'delivered',
  }
  return mapping[status] || 'new'
}


function formatTaskEventMessage(event: TaskEvent): string {
  const action = event.data?.action
  let actionText = ''

  // Generate human-readable text for each action type
  switch (action) {
    case 'task_created':
      actionText = 'Задача создана'
      break
    case 'task_assigned':
      actionText = 'Задача назначена репортеру'
      break
    case 'reassign_reporting_radiologist':
      actionText = 'Задача переназначена другому репортеру'
      break
    case 'task_in_progress':
      actionText = 'Работа над задачей начата'
      break
    case 'task_report_created': {
      const version = event.data.report_version
      actionText = version > 1
        ? `Отчет обновлен (версия ${version})`
        : 'Отчет создан'
      break
    }
    case 'task_report_translated':
      actionText = 'Отчет переведен и готов для валидации'
      break
    case 'task_assigned_for_validation_auto':
      actionText = 'Автоматически отправлено на валидацию (валидатор уже назначен)'
      break
    case 'task_report_assigned_for_validation':
      actionText = 'Задача назначена валидатору'
      break
    case 'task_report_under_validation':
      actionText = 'Валидация начата'
      break
    case 'task_report_edited_by_validator': {
      const oldVersion = event.data.old_version
      const newVersion = event.data.new_version
      actionText = `Отчет отредактирован валидатором (версия ${oldVersion} → ${newVersion})`
      break
    }
    case 'task_report_returned_for_revision':
      actionText = 'Отчет возвращен на доработку'
      break
    case 'task_report_finalized':
      actionText = 'Отчет финализирован'
      break
    case 'task_report_delivered':
      actionText = 'Отчет доставлен клиенту'
      break
    default:
      // For unknown actions, use the action name as fallback
      actionText = action ? `Действие: ${action}` : ''
  }

  // Combine action text with comment if both exist
  if (actionText && event.comment && event.comment.trim()) {
    return `${actionText}\n\nКомментарий: ${event.comment}`
  }

  // Return action text or comment, whichever is available
  return actionText || event.comment || ''
}


function mapTaskUrgency(urgency: string): Urgency {
  return urgency.toLowerCase() as Urgency
}


function mapModality(modality: string): Modality {
  if (modality === 'MR') {
    return 'MRI'
  }
  return modality as Modality
}


export function unmapStudyStatus(status: StudyStatus): BackendTaskStatus {
  const reverseMapping: Record<StudyStatus, BackendTaskStatus> = {
    new: 'new',
    assigned: 'assigned',
    'in-progress': 'in_progress',
    'draft-ready': 'draft_ready',
    translated: 'translated',
    'assigned-for-validation': 'assigned_for_validation',
    'under-validation': 'under_validation',
    returned: 'returned_for_revision',
    finalized: 'finalized',
    delivered: 'delivered',
  }
  return reverseMapping[status] || 'new'
}
