/**
 * Template service — CRUD for ReportTemplates.
 * Falls back to localStorage if backend is unavailable.
 */

import apiClient from '@/lib/api/client'
import type { ReportTemplate } from '@/types/study'

const API_BASE = '/api/v1/admin/templates'
const STORAGE_KEY = 'radreport_templates'

function loadFromStorage(): ReportTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(templates: ReportTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // Quota exceeded or private mode — silently ignore
  }
}

export const templateService = {
  async getAll(): Promise<ReportTemplate[]> {
    try {
      const res = await apiClient.get<{ items: ReportTemplate[] }>(API_BASE)
      const items = res.data.items || []
      saveToStorage(items)
      return items
    } catch {
      return loadFromStorage()
    }
  },

  async create(data: Omit<ReportTemplate, 'id' | 'createdAt'>): Promise<ReportTemplate> {
    const template: ReportTemplate = {
      ...data,
      id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    }
    try {
      const res = await apiClient.post<ReportTemplate>(API_BASE, template)
      const saved = res.data
      const local = loadFromStorage()
      const idx = local.findIndex(t => t.id === saved.id)
      if (idx === -1) local.push(saved)
      else local[idx] = saved
      saveToStorage(local)
      return saved
    } catch {
      const local = loadFromStorage()
      local.push(template)
      saveToStorage(local)
      return template
    }
  },

  async update(id: string, data: Partial<Omit<ReportTemplate, 'id' | 'createdAt'>>): Promise<ReportTemplate> {
    const local = loadFromStorage()
    const existing = local.find(t => t.id === id)
    if (!existing) throw new Error(`Template ${id} not found`)
    const updated: ReportTemplate = { ...existing, ...data }
    try {
      const res = await apiClient.put<ReportTemplate>(`${API_BASE}/${id}`, updated)
      const saved = res.data
      const idx = local.findIndex(t => t.id === id)
      if (idx !== -1) { local[idx] = saved; saveToStorage(local) }
      return saved
    } catch {
      const idx = local.findIndex(t => t.id === id)
      if (idx !== -1) { local[idx] = updated; saveToStorage(local) }
      return updated
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_BASE}/${id}`)
    } catch {
      // Backend unavailable
    }
    const local = loadFromStorage().filter(t => t.id !== id)
    saveToStorage(local)
  }
}
