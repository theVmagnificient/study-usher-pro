import { describe, it, expect } from 'vitest'
import {
  formatStudyId,
  parseStudyId,
  formatUserId,
  parseUserId,
  formatBodyArea,
  calculateDeadline,
} from '@/lib/mappers/utils'

describe('Mapper Utils', () => {
  describe('formatStudyId', () => {
    it('should format study ID with STD prefix and padding', () => {
      expect(formatStudyId(1)).toBe('STD-001')
      expect(formatStudyId(10)).toBe('STD-010')
      expect(formatStudyId(100)).toBe('STD-100')
      expect(formatStudyId(999)).toBe('STD-999')
      expect(formatStudyId(1234)).toBe('STD-1234')
    })
  })

  describe('parseStudyId', () => {
    it('should parse study ID from formatted string', () => {
      expect(parseStudyId('STD-001')).toBe(1)
      expect(parseStudyId('STD-010')).toBe(10)
      expect(parseStudyId('STD-100')).toBe(100)
      expect(parseStudyId('STD-999')).toBe(999)
      expect(parseStudyId('STD-1234')).toBe(1234)
    })

    it('should handle leading zeros correctly', () => {
      expect(parseStudyId('STD-001')).toBe(1)
      expect(parseStudyId('STD-099')).toBe(99)
    })
  })

  describe('formatUserId', () => {
    it('should format user ID with PHY prefix and padding', () => {
      expect(formatUserId(1)).toBe('PHY-001')
      expect(formatUserId(10)).toBe('PHY-010')
      expect(formatUserId(100)).toBe('PHY-100')
      expect(formatUserId(999)).toBe('PHY-999')
      expect(formatUserId(1234)).toBe('PHY-1234')
    })
  })

  describe('parseUserId', () => {
    it('should parse user ID from formatted string', () => {
      expect(parseUserId('PHY-001')).toBe(1)
      expect(parseUserId('PHY-010')).toBe(10)
      expect(parseUserId('PHY-100')).toBe(100)
      expect(parseUserId('PHY-999')).toBe(999)
      expect(parseUserId('PHY-1234')).toBe(1234)
    })
  })

  describe('formatBodyArea', () => {
    it('should format body area from uppercase to title case', () => {
      expect(formatBodyArea('CHEST')).toBe('Chest')
      expect(formatBodyArea('ABDOMEN')).toBe('Abdomen')
      expect(formatBodyArea('HEAD')).toBe('Head')
      expect(formatBodyArea('SPINE')).toBe('Spine')
      expect(formatBodyArea('NECK')).toBe('Neck')
    })

    it('should handle already formatted strings', () => {
      expect(formatBodyArea('Chest')).toBe('Chest')
    })
  })

  describe('calculateDeadline', () => {
    it('should calculate deadline by adding TAT hours', () => {
      const receivedAt = '2024-01-15T08:00:00.000Z'
      const deadline = calculateDeadline(receivedAt, 4)

      const received = new Date(receivedAt)
      const calculated = new Date(deadline)

      const diffHours = (calculated.getTime() - received.getTime()) / (1000 * 60 * 60)
      expect(diffHours).toBe(4)
    })

    it('should handle different TAT values', () => {
      const receivedAt = '2024-01-15T08:00:00.000Z'

      const deadline2h = calculateDeadline(receivedAt, 2)
      const deadline8h = calculateDeadline(receivedAt, 8)
      const deadline24h = calculateDeadline(receivedAt, 24)

      const received = new Date(receivedAt)

      expect((new Date(deadline2h).getTime() - received.getTime()) / (1000 * 60 * 60)).toBe(2)
      expect((new Date(deadline8h).getTime() - received.getTime()) / (1000 * 60 * 60)).toBe(8)
      expect((new Date(deadline24h).getTime() - received.getTime()) / (1000 * 60 * 60)).toBe(24)
    })

    it('should return ISO string format', () => {
      const receivedAt = '2024-01-15T08:00:00.000Z'
      const deadline = calculateDeadline(receivedAt, 4)

      expect(deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })
})
