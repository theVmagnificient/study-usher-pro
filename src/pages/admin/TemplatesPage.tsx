import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { useTemplateStore } from '@/stores/templateStore'
import type { Modality, BodyArea } from '@/types/study'

const MODALITIES: Modality[] = ['CT', 'MRI', 'X-Ray', 'US', 'PET', 'NM']
const BODY_AREAS: BodyArea[] = [
  'Head', 'Neck', 'Chest', 'Abdomen', 'Pelvis',
  'Spine', 'Upper Extremity', 'Lower Extremity', 'Whole Body'
]

const defaultForm = {
  name: '',
  clientId: '',
  clientName: '',
  modality: '' as Modality | '',
  bodyArea: '' as BodyArea | '',
  hasIvContrast: false,
  protocol: '',
  findings: '',
  impression: '',
  createdBy: 'admin',
}

export default function TemplatesPage() {
  const { t } = useTranslation()
  const store = useTemplateStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState(defaultForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { store.fetchTemplates() }, [])

  function handleNew() {
    setFormData(defaultForm)
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name || !formData.modality || !formData.bodyArea) return
    setIsSaving(true)
    try {
      await store.createTemplate({
        name: formData.name,
        clientId: formData.clientId,
        clientName: formData.clientName,
        modality: formData.modality as Modality,
        bodyArea: formData.bodyArea as BodyArea,
        hasIvContrast: formData.hasIvContrast,
        protocol: formData.protocol,
        findings: formData.findings,
        impression: formData.impression,
        createdBy: formData.createdBy,
      })
      setIsDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('templates.title')}
        subtitle={store.loading ? t('common.loading') : t('templates.subtitle')}
        actions={
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            {t('templates.addTemplate')}
          </Button>
        }
      />

      {store.error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{store.error}</div>
      )}

      <div className="clinical-card overflow-hidden">
        {store.templates.length === 0 && !store.loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">{t('templates.placeholder')}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('templates.table.name')}</th>
                <th>{t('templates.table.client')}</th>
                <th>{t('templates.table.modality')}</th>
                <th>{t('templates.table.zone')}</th>
                <th>{t('templates.table.ivContrast')}</th>
                <th>{t('templates.table.addedBy')}</th>
                <th>{t('templates.table.dateAdded')}</th>
              </tr>
            </thead>
            <tbody>
              {store.templates.map(tpl => (
                <tr key={tpl.id}>
                  <td className="font-medium text-sm">{tpl.name}</td>
                  <td className="text-sm">{tpl.clientName || '—'}</td>
                  <td className="text-sm">{tpl.modality}</td>
                  <td className="text-sm">{tpl.bodyArea}</td>
                  <td className="text-sm">{tpl.hasIvContrast ? t('common.yes') : t('common.no')}</td>
                  <td className="text-sm">{tpl.createdBy}</td>
                  <td className="text-sm">
                    {new Date(tpl.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{t('templates.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('templates.form.client')}</Label>
              <Input
                value={formData.clientName}
                onChange={e => setFormData(f => ({ ...f, clientName: e.target.value, clientId: e.target.value }))}
                placeholder={t('templates.form.clientPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('templates.form.modality')}</Label>
                <Select
                  value={formData.modality}
                  onValueChange={val => setFormData(f => ({ ...f, modality: val as Modality }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('templates.form.modalityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALITIES.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('templates.form.bodyArea')}</Label>
                <Select
                  value={formData.bodyArea}
                  onValueChange={val => setFormData(f => ({ ...f, bodyArea: val as BodyArea }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('templates.form.bodyAreaPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_AREAS.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="iv-contrast"
                checked={formData.hasIvContrast}
                onCheckedChange={checked => setFormData(f => ({ ...f, hasIvContrast: !!checked }))}
              />
              <Label htmlFor="iv-contrast">{t('templates.form.hasIvContrast')}</Label>
            </div>
            <div className="grid gap-2">
              <Label>{t('templates.form.name')}</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder={t('templates.form.namePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('templates.form.constructor')}</Label>
              <Textarea
                value={formData.findings}
                onChange={e => setFormData(f => ({ ...f, findings: e.target.value }))}
                rows={6}
                placeholder=""
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name || !formData.modality || !formData.bodyArea}>
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
