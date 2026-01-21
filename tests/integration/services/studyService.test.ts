import { describe, it, expect, beforeEach, vi } from 'vitest'
import { studyService } from '@/services/studyService'
import apiClient from '@/lib/api/client'
import { lookupCache } from '@/lib/cache/lookupCache'
import type { PaginatedResponse, Study as BackendStudy, Task, ClientType, Client, User } from '@/types/api'


vi.mock('@/lib/api/client')

describe('studyService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lookupCache.clearAll()
  })

  describe('getAll', () => {
    it('should fetch and transform studies correctly', async () => {

      const mockBackendStudy: BackendStudy = {
        id: 10,
        client_id: 2,
        client_type_id: 3,
        processing_status: 'processing_finished',
        instance_uid: 'test-uid',
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

      const mockTask: Task = {
        id: 1,
        study_id: 10,
        urgency: 'stat',
        status: 'in_progress',
        clinical_notes: '',
        technical_notes: '',
        reporting_radiologist_id: 5,
        validating_radiologist_id: null,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:30:00Z',
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

      const mockUser: User = {
        id: 5,
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'mchen@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }


      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url === '/api/v1/admin/studies') {
          return Promise.resolve({
            data: {
              items: [mockBackendStudy],
              total: 1,
              page: 1,
              per_page: 20,
              total_pages: 1,
            } as PaginatedResponse<BackendStudy>,
          } as any)
        }

        if (url === '/api/v1/admin/studies/10') {
          return Promise.resolve({ data: mockBackendStudy } as any)
        }

        if (url === '/api/v1/admin/studies/10/task') {
          return Promise.resolve({ data: mockTask } as any)
        }

        if (url === '/api/v1/admin/client-types/3') {
          return Promise.resolve({ data: mockClientType } as any)
        }

        if (url === '/api/v1/admin/clients/2') {
          return Promise.resolve({ data: mockClient } as any)
        }

        if (url === '/api/v1/admin/users/5') {
          return Promise.resolve({ data: mockUser } as any)
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      })


      const result = await studyService.getAll({}, 1, 20)


      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)

      const study = result.items[0]
      expect(study.id).toBe('STD-010')
      expect(study.patientId).toBe('PAT-12345')
      expect(study.clientName).toBe('City General Hospital')
      expect(study.status).toBe('in-progress')
      expect(study.urgency).toBe('stat')
      expect(study.modality).toBe('CT')
      expect(study.bodyArea).toBe('Chest')
      expect(study.assignedPhysician).toBe('Dr. Michael Chen')
      expect(study.sex).toBe('M')
      expect(study.age).toBe(54)
    })

    it('should apply filters to request params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          items: [],
          total: 0,
          page: 1,
          per_page: 20,
          total_pages: 0,
        },
      } as any)

      const filters = {
        status: 'in-progress' as const,
        client: 'Test Hospital',
        modality: 'CT' as const,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-01-31'),
      }

      await studyService.getAll(filters, 1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/studies', {
        params: expect.objectContaining({
          page: 1,
          per_page: 20,
          status: 'in-progress',
          client: 'Test Hospital',
          modality: 'CT',
          date_from: expect.any(String),
          date_to: expect.any(String),
        }),
      })
    })

    it('should use lookup cache for repeated lookups', async () => {

      const mockClient: Client = {
        id: 2,
        name: 'Cached Hospital',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      lookupCache.setClient(mockClient)

      const mockBackendStudy: BackendStudy = {
        id: 10,
        client_id: 2,
        client_type_id: 3,
        processing_status: 'processing_finished',
        instance_uid: 'test',
        accession_number: 'ACC-001',
        study_datetime: '2024-01-15T08:00:00Z',
        patient_id: 'PAT-001',
        patient_sex: 'M',
        patient_age: 50,
        description: 'Test',
        report_text: null,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z',
      }

      const mockTask: Task = {
        id: 1,
        study_id: 10,
        urgency: 'routine',
        status: 'new',
        clinical_notes: '',
        technical_notes: '',
        reporting_radiologist_id: null,
        validating_radiologist_id: null,
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

      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url === '/api/v1/admin/studies') {
          return Promise.resolve({
            data: {
              items: [mockBackendStudy],
              total: 1,
              page: 1,
              per_page: 20,
              total_pages: 1,
            },
          } as any)
        }

        if (url === '/api/v1/admin/studies/10') {
          return Promise.resolve({ data: mockBackendStudy } as any)
        }

        if (url === '/api/v1/admin/studies/10/task') {
          return Promise.resolve({ data: mockTask } as any)
        }

        if (url === '/api/v1/admin/client-types/3') {
          return Promise.resolve({ data: mockClientType } as any)
        }


        if (url === '/api/v1/admin/clients/2') {
          throw new Error('Should use cache, not fetch from API')
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      })

      const result = await studyService.getAll({}, 1, 20)


      expect(result.items[0].clientName).toBe('Cached Hospital')


      expect(apiClient.get).not.toHaveBeenCalledWith('/api/v1/admin/clients/2', expect.anything())
    })
  })

  describe('getById', () => {
    it('should fetch single study by ID', async () => {
      const mockBackendStudy: BackendStudy = {
        id: 10,
        client_id: 2,
        client_type_id: 3,
        processing_status: 'processing_finished',
        instance_uid: 'test-uid',
        accession_number: 'ACC-001',
        study_datetime: '2024-01-15T08:00:00Z',
        patient_id: 'PAT-12345',
        patient_sex: 'F',
        patient_age: 45,
        description: 'MRI Brain',
        report_text: null,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z',
      }

      const mockTask: Task = {
        id: 1,
        study_id: 10,
        urgency: 'urgent',
        status: 'assigned',
        clinical_notes: '',
        technical_notes: '',
        reporting_radiologist_id: null,
        validating_radiologist_id: null,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:30:00Z',
      }

      const mockClientType: ClientType = {
        id: 3,
        client_id: 2,
        modality: 'MR',
        body_area: 'HEAD',
        expected_tat_hours: 2,
        price: 200,
        payout: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockClient: Client = {
        id: 2,
        name: 'University Hospital',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url === '/api/v1/admin/studies/10') {
          return Promise.resolve({ data: mockBackendStudy } as any)
        }

        if (url === '/api/v1/admin/studies/10/task') {
          return Promise.resolve({ data: mockTask } as any)
        }

        if (url === '/api/v1/admin/client-types/3') {
          return Promise.resolve({ data: mockClientType } as any)
        }

        if (url === '/api/v1/admin/clients/2') {
          return Promise.resolve({ data: mockClient } as any)
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      })

      const result = await studyService.getById('STD-010')

      expect(result.id).toBe('STD-010')
      expect(result.patientId).toBe('PAT-12345')
      expect(result.clientName).toBe('University Hospital')
      expect(result.status).toBe('assigned')
      expect(result.urgency).toBe('urgent')
      expect(result.modality).toBe('MR')
      expect(result.bodyArea).toBe('Head')
      expect(result.sex).toBe('F')
      expect(result.age).toBe(45)
    })
  })
})
