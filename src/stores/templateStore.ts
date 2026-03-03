import { create } from 'zustand'
import type { ReportTemplate, Modality, BodyArea } from '@/types/study'
import { templateService } from '@/services/templateService'

interface TemplateStore {
  templates: ReportTemplate[]
  loading: boolean
  error: string | null
  fetchTemplates: () => Promise<void>
  createTemplate: (data: Omit<ReportTemplate, 'id' | 'createdAt'>) => Promise<ReportTemplate>
  updateTemplate: (id: string, data: Partial<Omit<ReportTemplate, 'id' | 'createdAt'>>) => Promise<ReportTemplate>
  deleteTemplate: (id: string) => Promise<void>
  templatesFor: (modality: Modality, bodyArea: BodyArea) => ReportTemplate[]
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  async fetchTemplates() {
    set({ loading: true, error: null })
    try {
      const templates = await templateService.getAll()
      set({ templates })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch templates' })
    } finally {
      set({ loading: false })
    }
  },

  async createTemplate(data) {
    const template = await templateService.create(data)
    set(s => ({ templates: [...s.templates, template] }))
    return template
  },

  async updateTemplate(id, data) {
    const updated = await templateService.update(id, data)
    set(s => ({ templates: s.templates.map(t => t.id === id ? updated : t) }))
    return updated
  },

  async deleteTemplate(id) {
    await templateService.delete(id)
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }))
  },

  templatesFor(modality, bodyArea) {
    return get().templates.filter(t => t.modality === modality && t.bodyArea === bodyArea)
  },
}))
