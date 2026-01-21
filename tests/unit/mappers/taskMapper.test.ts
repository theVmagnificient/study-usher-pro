import { describe, it, expect } from 'vitest'
import { mapTaskToStudy } from '@/lib/mappers/taskMapper'
import type { Task, Study as BackendStudy, ClientType, Client, User } from '@/types/api'

describe('taskMapper', () => {
  const mockTask: Task = {
    id: 1,
    study_id: 10,
    urgency: 'stat',
    status: 'in_progress',
    clinical_notes: 'Test notes',
    technical_notes: 'Tech notes',
    reporting_radiologist_id: 5,
    validating_radiologist_id: null,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:30:00Z',
  }

  const mockBackendStudy: BackendStudy = {
    id: 10,
    client_id: 2,
    client_type_id: 3,
    processing_status: 'processing_finished',
    instance_uid: 'test-uid-123',
    accession_number: 'ACC-001',
    study_datetime: '2024-01-15T08:00:00Z',
    patient_id: 'PAT-12345',
    patient_sex: 'M',
    patient_age: 54,
    description: 'CT Chest',
    report_text: null,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
  }

  const mockClientType: ClientType = {
    id: 3,
    client_id: 2,
    modality: 'CT',
    body_area: 'CHEST',
    expected_tat_hours: 4,
    price: 150,
    payout: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockClient: Client = {
    id: 2,
    name: 'City General Hospital',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockReportingUser: User = {
    id: 5,
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'mchen@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('mapTaskToStudy', () => {
    it('should map backend data to frontend Study format', () => {
      const result = mapTaskToStudy({
        task: mockTask,
        study: mockBackendStudy,
        clientType: mockClientType,
        client: mockClient,
        reportingUser: mockReportingUser,
      })

      expect(result.id).toBe('STD-010')
      expect(result.patientId).toBe('PAT-12345')
      expect(result.clientName).toBe('City General Hospital')
      expect(result.status).toBe('in-progress')
      expect(result.urgency).toBe('stat')
      expect(result.modality).toBe('CT')
      expect(result.bodyArea).toBe('Chest')
      expect(result.assignedPhysician).toBe('Dr. Michael Chen')
      expect(result.receivedAt).toBe('2024-01-15T08:00:00Z')
      expect(result.sex).toBe('M')
      expect(result.age).toBe(54)
    })

    it('should format study ID with padding', () => {
      const result = mapTaskToStudy({
        task: mockTask,
        study: { ...mockBackendStudy, id: 1 },
        clientType: mockClientType,
        client: mockClient,
      })

      expect(result.id).toBe('STD-001')
    })

    it('should handle missing reporting user', () => {
      const result = mapTaskToStudy({
        task: mockTask,
        study: mockBackendStudy,
        clientType: mockClientType,
        client: mockClient,
      })

      expect(result.assignedPhysician).toBeUndefined()
    })

    it('should calculate deadline based on TAT', () => {
      const result = mapTaskToStudy({
        task: mockTask,
        study: mockBackendStudy,
        clientType: mockClientType,
        client: mockClient,
      })

      const received = new Date(mockBackendStudy.study_datetime)
      const deadline = new Date(result.deadline)
      const diffHours = (deadline.getTime() - received.getTime()) / (1000 * 60 * 60)

      expect(diffHours).toBe(mockClientType.expected_tat_hours)
    })

    it('should map different task statuses correctly', () => {
      const statusMappings = [
        { backend: 'new', frontend: 'new' },
        { backend: 'assigned', frontend: 'assigned' },
        { backend: 'in_progress', frontend: 'in-progress' },
        { backend: 'draft_ready', frontend: 'draft-ready' },
        { backend: 'under_validation', frontend: 'under-validation' },
        { backend: 'finalized', frontend: 'finalized' },
        { backend: 'delivered', frontend: 'delivered' },
      ]

      statusMappings.forEach(({ backend, frontend }) => {
        const result = mapTaskToStudy({
          task: { ...mockTask, status: backend as any },
          study: mockBackendStudy,
          clientType: mockClientType,
          client: mockClient,
        })

        expect(result.status).toBe(frontend)
      })
    })

    it('should map different urgency levels', () => {
      const urgencies = ['routine', 'urgent', 'stat']

      urgencies.forEach((urgency) => {
        const result = mapTaskToStudy({
          task: { ...mockTask, urgency: urgency as any },
          study: mockBackendStudy,
          clientType: mockClientType,
          client: mockClient,
        })

        expect(result.urgency).toBe(urgency)
      })
    })

    it('should format different body areas', () => {
      const bodyAreas = [
        { backend: 'CHEST', frontend: 'Chest' },
        { backend: 'ABDOMEN', frontend: 'Abdomen' },
        { backend: 'HEAD', frontend: 'Head' },
        { backend: 'SPINE', frontend: 'Spine' },
      ]

      bodyAreas.forEach(({ backend, frontend }) => {
        const result = mapTaskToStudy({
          task: mockTask,
          study: mockBackendStudy,
          clientType: { ...mockClientType, body_area: backend as any },
          client: mockClient,
        })

        expect(result.bodyArea).toBe(frontend)
      })
    })

    it('should set hasPriors to false (TODO: backend needs this field)', () => {
      const result = mapTaskToStudy({
        task: mockTask,
        study: mockBackendStudy,
        clientType: mockClientType,
        client: mockClient,
      })

      expect(result.hasPriors).toBe(false)
    })
  })
})
