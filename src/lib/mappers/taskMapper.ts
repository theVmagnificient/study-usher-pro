import type { Study, StudyStatus, Urgency, Modality, ValidatorComment, PriorStudy, AuditLogEntry } from '@/types/study'
import type {
  Task,
  Study as BackendStudy,
  ClientType,
  User,
  Client,
  TaskStatus as BackendTaskStatus,
  ReportComment,
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
  validatorComments?: ReportComment[]
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
  const { task, study, clientType, client, reportingUser, validatingUser, validatorComments, priorStudies, currentReport } = ctx

  // Map ReportComment to ValidatorComment format
  const mappedValidatorComments: ValidatorComment[] | undefined = validatorComments
    ?.map((comment) => ({
      id: `comment-${comment.id}`,
      text: comment.text,
      validatorName: comment.author_first_name && comment.author_last_name
        ? formatPhysicianName(comment.author_first_name, comment.author_last_name)
        : comment.author_email || 'Unknown Validator',
      timestamp: comment.created_at,
      isCritical: comment.comment_type === 'critical',
      isAction: false,  // Actions are not comments
      isNonCritical: comment.comment_type === 'non_critical',
    }))

  // Get validator comments count from embedded data if available, otherwise use array length
  const taskWithEmbedded = task as import('@/types/api').TaskWithEmbedded
  const validatorCommentsCount = taskWithEmbedded.validator_comments_count ?? mappedValidatorComments?.length ?? 0

  // Audit log is no longer derived from comments - should come from a separate endpoint if needed
  const auditLog: AuditLogEntry[] | undefined = undefined

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
    updatedAt: task.updated_at,
    clinicalNotes: task.clinical_notes || '',
    technicalNotes: task.technical_notes || '',
    validatorCommentsCount,
    validatorComments: mappedValidatorComments,
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
    draft_saved: 'draft-saved',
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
    'draft-saved': 'draft_saved',
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
