export type StudyStatus =
  | 'new'
  | 'assigned'
  | 'in-progress'
  | 'draft-saved'
  | 'draft-ready'
  | 'translated'
  | 'assigned-for-validation'
  | 'under-validation'
  | 'returned'
  | 'finalized'
  | 'delivered';

export type Urgency = 'stat' | 'urgent' | 'routine';

export type Modality = 'CT' | 'MRI' | 'X-Ray' | 'US' | 'PET' | 'NM';

export type BodyArea = 
  | 'Head'
  | 'Neck'
  | 'Chest'
  | 'Abdomen'
  | 'Pelvis'
  | 'Spine'
  | 'Upper Extremity'
  | 'Lower Extremity'
  | 'Whole Body';

export type UserRole = 'admin' | 'reporting-radiologist' | 'validating-radiologist';

export interface Study {
  id: number;
  taskId: number;
  studyId: number;
  patientId: string;
  clientName: string;
  status: StudyStatus;
  urgency: Urgency;
  modality: Modality;
  bodyArea: BodyArea;
  assignedPhysician?: string;
  receivedAt: string;
  deadline: string;
  hasPriors: boolean;
  priorCount?: number;
  priorStudies?: PriorStudy[];
  sex: 'M' | 'F';
  age: number;
  description: string;
  accessionNumber: string;
  /** Task updated_at timestamp — used as delivery time for delivered tasks */
  updatedAt?: string;
  clinicalNotes: string;
  technicalNotes: string;
  /** Group ID for multi-zone studies (same patient, multiple body areas) */
  linkedStudyGroup?: string;
  /** Number of validator comments (for display badge) */
  validatorCommentsCount?: number;
  /** Validator comments on the report quality/impressions */
  validatorComments?: ValidatorComment[];
  /** Full audit log of all task events */
  auditLog?: AuditLogEntry[];
  /** Current report content */
  report?: {
    protocol?: string;
    protocolEn?: string;
    findings?: string;
    findingsEn?: string;
    impression?: string;
    impressionEn?: string;
  };
}

export interface ValidatorComment {
  id: string;
  text: string;
  validatorName: string;
  timestamp: string;
  isCritical?: boolean;
  isAction?: boolean; // Flag to distinguish actions from regular comments
  isNonCritical?: boolean; // Flag for non-critical comments at finalization
}

export interface TaskType {
  id: string;
  client: string;
  modality: Modality;
  bodyArea: BodyArea;
  hasPriors: boolean;
  expectedTAT: number; // in hours
  price: number;
  physicianPayout: number;
}

export interface Physician {
  id: string;
  fullName: string;
  phone: string;
  telegram?: string;
  role: UserRole;
  schedule: {
    days: string[];
    hours: { start: string; end: string };
  };
  /** Custom schedule overrides for specific dates (key: YYYY-MM-DD) */
  customSchedule?: Record<string, number[]>;
  supportedModalities: Modality[];
  supportedBodyAreas: BodyArea[];
  activeStudies: number;
  maxActiveStudies: number;
  statistics: {
    total: number;
    byModality: Record<Modality, number>;
    byBodyArea: Record<BodyArea, number>;
  };
}

export interface PriorStudy {
  id: number; // Study ID (numeric)
  type: string;
  date: string;
  protocol?: string;
  protocolEn?: string;
  findings?: string;
  findingsEn?: string;
  impression?: string;
  impressionEn?: string;
  reportText?: string;
}

export interface AuditLogEntry {
  id: string;
  studyId: number;
  accessionNumber?: string;
  action: string;
  user: string;
  timestamp: string;
  previousStatus?: StudyStatus;
  newStatus?: StudyStatus;
  comment?: string;
}
