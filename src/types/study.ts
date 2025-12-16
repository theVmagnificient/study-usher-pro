export type StudyStatus = 
  | 'new'
  | 'assigned'
  | 'in-progress'
  | 'draft-ready'
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
  id: string;
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
  sex: 'M' | 'F';
  age: number;
  /** Group ID for multi-zone studies (same patient, multiple body areas) */
  linkedStudyGroup?: string;
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
  schedule: {
    days: string[];
    hours: { start: string; end: string };
  };
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
  id: string;
  type: string;
  date: string;
  reportText?: string;
}

export interface AuditLogEntry {
  id: string;
  studyId: string;
  action: string;
  user: string;
  timestamp: string;
  previousStatus?: StudyStatus;
  newStatus?: StudyStatus;
  comment?: string;
}
