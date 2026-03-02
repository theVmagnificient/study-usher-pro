import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { lookupCache } from '@/lib/lookup/lookupCache'
import type { User, Client, ClientType } from '@/types/api'

describe('LookupCache', () => {
  beforeEach(() => {
    lookupCache.clearAll()
  })

  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockClient: Client = {
    id: 1,
    name: 'Test Hospital',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockClientType: ClientType = {
    id: 1,
    client_id: 1,
    modality: 'CT',
    body_area: 'CHEST',
    expected_tat_hours: 4,
    price: 150,
    payout: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('User Cache', () => {
    it('should set and get user', () => {
      lookupCache.setUser(mockUser)
      const retrieved = lookupCache.getUser(1)

      expect(retrieved).toEqual(mockUser)
    })

    it('should return undefined for non-existent user', () => {
      const retrieved = lookupCache.getUser(999)
      expect(retrieved).toBeUndefined()
    })

    it('should set multiple users', () => {
      const users = [
        mockUser,
        { ...mockUser, id: 2, first_name: 'Jane' },
        { ...mockUser, id: 3, first_name: 'Bob' },
      ]

      lookupCache.setUsers(users)

      expect(lookupCache.getUser(1)).toBeDefined()
      expect(lookupCache.getUser(2)).toBeDefined()
      expect(lookupCache.getUser(3)).toBeDefined()
    })

    it('should clear users', () => {
      lookupCache.setUser(mockUser)
      lookupCache.clearUsers()

      expect(lookupCache.getUser(1)).toBeUndefined()
    })
  })

  describe('Client Cache', () => {
    it('should set and get client', () => {
      lookupCache.setClient(mockClient)
      const retrieved = lookupCache.getClient(1)

      expect(retrieved).toEqual(mockClient)
    })

    it('should return undefined for non-existent client', () => {
      const retrieved = lookupCache.getClient(999)
      expect(retrieved).toBeUndefined()
    })

    it('should set multiple clients', () => {
      const clients = [
        mockClient,
        { ...mockClient, id: 2, name: 'Hospital 2' },
        { ...mockClient, id: 3, name: 'Hospital 3' },
      ]

      lookupCache.setClients(clients)

      expect(lookupCache.getClient(1)).toBeDefined()
      expect(lookupCache.getClient(2)).toBeDefined()
      expect(lookupCache.getClient(3)).toBeDefined()
    })

    it('should clear clients', () => {
      lookupCache.setClient(mockClient)
      lookupCache.clearClients()

      expect(lookupCache.getClient(1)).toBeUndefined()
    })
  })

  describe('ClientType Cache', () => {
    it('should set and get client type', () => {
      lookupCache.setClientType(mockClientType)
      const retrieved = lookupCache.getClientType(1)

      expect(retrieved).toEqual(mockClientType)
    })

    it('should return undefined for non-existent client type', () => {
      const retrieved = lookupCache.getClientType(999)
      expect(retrieved).toBeUndefined()
    })

    it('should set multiple client types', () => {
      const clientTypes = [
        mockClientType,
        { ...mockClientType, id: 2, modality: 'MR' as any },
        { ...mockClientType, id: 3, body_area: 'HEAD' as any },
      ]

      lookupCache.setClientTypes(clientTypes)

      expect(lookupCache.getClientType(1)).toBeDefined()
      expect(lookupCache.getClientType(2)).toBeDefined()
      expect(lookupCache.getClientType(3)).toBeDefined()
    })

    it('should clear client types', () => {
      lookupCache.setClientType(mockClientType)
      lookupCache.clearClientTypes()

      expect(lookupCache.getClientType(1)).toBeUndefined()
    })
  })

  describe('Cache TTL', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should expire entries after TTL', () => {
      lookupCache.setUser(mockUser)


      expect(lookupCache.getUser(1)).toBeDefined()


      vi.advanceTimersByTime(5 * 60 * 1000 + 1)


      expect(lookupCache.getUser(1)).toBeUndefined()
    })

    it('should not expire entries before TTL', () => {
      lookupCache.setUser(mockUser)


      vi.advanceTimersByTime(4 * 60 * 1000)


      expect(lookupCache.getUser(1)).toBeDefined()
    })
  })

  describe('clearAll', () => {
    it('should clear all caches', () => {
      lookupCache.setUser(mockUser)
      lookupCache.setClient(mockClient)
      lookupCache.setClientType(mockClientType)

      lookupCache.clearAll()

      expect(lookupCache.getUser(1)).toBeUndefined()
      expect(lookupCache.getClient(1)).toBeUndefined()
      expect(lookupCache.getClientType(1)).toBeUndefined()
    })
  })

  describe('getStats', () => {
    it('should return cache statistics', () => {
      lookupCache.setUser(mockUser)
      lookupCache.setUser({ ...mockUser, id: 2 })
      lookupCache.setClient(mockClient)
      lookupCache.setClientType(mockClientType)

      const stats = lookupCache.getStats()

      expect(stats.users).toBe(2)
      expect(stats.clients).toBe(1)
      expect(stats.clientTypes).toBe(1)
    })

    it('should return zero for empty cache', () => {
      const stats = lookupCache.getStats()

      expect(stats.users).toBe(0)
      expect(stats.clients).toBe(0)
      expect(stats.clientTypes).toBe(0)
    })
  })
})
