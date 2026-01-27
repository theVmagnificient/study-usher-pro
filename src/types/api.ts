export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export type TaskStatus =
  | 'integrity_validation'
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'draft_ready'
  | 'translated'
  | 'assigned_for_validation'
  | 'under_validation'
  | 'returned_for_revision'
  | 'finalized'
  | 'delivered'

export type TaskUrgency = 'routine' | 'urgent' | 'stat'
export type Modality = 'CT' | 'MR'
export type BodyArea = 'CHEST' | 'ABDOMEN' | 'HEAD' | 'SPINE'
export type PatientSex = 'M' | 'F'
export type StudyProcessingStatus = 'failed' | 'created' | 'processing' | 'processing_finished'

export interface Task {
  id: number
  study_id: number
  urgency: TaskUrgency
  status: TaskStatus
  clinical_notes: string
  technical_notes: string
  reporting_radiologist_id: number | null
  validating_radiologist_id: number | null
  created_at: string
  updated_at: string
}

export interface Study {
  id: number
  client_id: number
  client_type_id: number
  processing_status: StudyProcessingStatus
  instance_uid: string
  accession_number: string
  study_datetime: string
  patient_id: string
  patient_sex: PatientSex
  patient_age: number
  description: string
  report_text: string | null
  created_at: string
  updated_at: string
}

export interface ClientType {
  id: number
  client_id: number
  modality: Modality
  body_area: BodyArea
  has_priors: boolean
  expected_tat_hours: number
  price: number
  payout: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  user_id: number
  specialization: string | null
  role: string | null
  created_at: string
  updated_at: string
}

export interface Report {
  id: number
  task_id: number
  version: number
  author_id: number
  protocol: string | null
  findings: string | null
  impression: string | null
  protocol_en: string | null
  findings_en: string | null
  impression_en: string | null
  created_at: string
  updated_at: string
}

export interface TaskEvent {
  task_id: number
  user_id: number | null
  comment: string | null
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ScheduleSlot {
  id: number
  user_id: number
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface ScheduleSlotEmbedded {
  id: number
  start_time: string
  end_time: string
  is_available: boolean
}

export interface UserWithDetails {
  id: number
  first_name: string
  last_name: string
  email: string
  created_at: string
  updated_at: string

  role: string | null
  specialization: string | null

  schedule_slots: ScheduleSlotEmbedded[]

  active_task_count: number
}

export interface WorkforceStats {
  active_users: number
  total_users: number
  reporting_radiologists: number
  validating_radiologists: number
  tasks_completed: number
  tasks_in_progress: number
  average_completion_time_hours: number
  tasks_completed_per_day: Array<{ day: string; value: number }>
  active_users_per_day: Array<{ day: string; value: number }>
}

export interface SLAStats {
  client_id: number | null
  total_tasks: number
  completed_on_time: number
  completed_late: number
  sla_compliance_rate: number
  average_tat_hours: number
  sla_compliance_per_day: Array<{ day: string; value: number }>
}

export interface UserStats {
  user_id: number
  total_tasks: number
  tasks_this_month: number
  tasks_last_month: number
  tasks_by_modality: Record<string, number>
  tasks_by_body_area: Record<string, number>
  monthly_tasks_by_modality: Record<string, number>
  monthly_tasks_by_body_area: Record<string, number>
  average_completion_time_hours: number
  tasks_completed_per_day: Array<{ day: string; value: number }>
}

export interface PriorStudyReport {
  protocol: string | null
  findings: string | null
  impression: string | null
  protocol_en: string | null
  findings_en: string | null
  impression_en: string | null
  report_text: string | null
}

export interface PriorStudy {
  study_id: number
  study_datetime: string
  modality: Modality
  body_area: BodyArea
  description: string
  accession_number: string
  report: PriorStudyReport | null
}

// Embedded types for optimized API responses

export interface ClientTypeEmbedded {
  id: number
  modality: Modality
  body_area: BodyArea
  expected_tat_hours: number
}

export interface UserEmbedded {
  id: number
  first_name: string
  last_name: string
  email: string
}

export interface TaskWithEmbedded extends Task {
  study?: Study  // Full Study with all DICOM fields
  client_type?: ClientTypeEmbedded
  reporting_radiologist?: UserEmbedded | null
  validating_radiologist?: UserEmbedded | null
  validator_comments_count?: number
}

export interface TaskEventWithEmbedded extends TaskEvent {
  study_id?: number
  user?: UserEmbedded | null
}

export interface UserProfileWithDetails {
  user_id: number
  specialization: string | null
  role: string | null
  schedule_slots: ScheduleSlotEmbedded[]
  statistics: {
    user_id: number
    total_tasks: number
    tasks_this_month: number
    tasks_last_month: number
    tasks_by_modality: Record<string, number>
    tasks_by_body_area: Record<string, number>
    monthly_tasks_by_modality: Record<string, number>
    monthly_tasks_by_body_area: Record<string, number>
    average_completion_time_hours: number
    tasks_completed_per_day: Array<{ day: string; value: number }>
  }
}

export interface TaskDetail {
  task: TaskWithEmbedded
  validator_comments: TaskEventWithEmbedded[]
  prior_studies: PriorStudy[]
  latest_report: Report | null
}
