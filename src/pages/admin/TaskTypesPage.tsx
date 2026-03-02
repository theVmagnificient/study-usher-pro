import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { useClientTypeStore } from '@/stores/clientTypeStore'
import apiClient from '@/lib/api/client'
import { parseTaskTypeId } from '@/lib/mappers/utils'
import type { TaskType, Modality, BodyArea } from '@/types/study'
import type { Client } from '@/types/api'
import type { ClientTypeCreateData, ClientTypeUpdateData } from '@/services/clientTypeService'

export default function TaskTypesPage() {
  const { t } = useTranslation()
  const clientTypeStore = useClientTypeStore()
  const { clientTypes, loading, error, pagination } = clientTypeStore

  // Create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [formData, setFormData] = useState<{
    clientId: string | null
    modality: Modality | null
    bodyArea: BodyArea | null
    hasPriors: boolean
    expectedTAT: string
    price: string
    payout: string
  }>({ clientId: null, modality: null, bodyArea: null, hasPriors: false, expectedTAT: '4', price: '0', payout: '0' })

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskTypeToDelete, setTaskTypeToDelete] = useState<TaskType | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { clientTypeStore.fetchClientTypes() }, [])

  const isFormValid =
    formData.clientId !== null &&
    formData.modality !== null &&
    formData.bodyArea !== null &&
    parseFloat(formData.expectedTAT) > 0 &&
    parseFloat(formData.price) >= 0 &&
    parseFloat(formData.payout) >= 0

  async function fetchClients() {
    setLoadingClients(true)
    try {
      const response = await apiClient.get<{ items: Client[] }>('/api/v1/admin/clients')
      setClients(response.data.items || [])
    } catch {
      setFormError('Failed to load clients')
    } finally {
      setLoadingClients(false)
    }
  }

  function resetForm() {
    setFormData({ clientId: null, modality: null, bodyArea: null, hasPriors: false, expectedTAT: '4', price: '0', payout: '0' })
    setFormError(null)
  }

  async function handleNew() {
    setEditingId(null)
    resetForm()
    await fetchClients()
    setDialogOpen(true)
  }

  async function handleEdit(id: string) {
    setEditingId(id)
    resetForm()
    await fetchClients()
    const tt = clientTypeStore.clientTypes.find(x => x.id === id)
    if (tt) {
      const client = clients.find(c => c.name === tt.client)
      setFormData({
        clientId: client?.id?.toString() || null,
        modality: tt.modality,
        bodyArea: tt.bodyArea,
        hasPriors: tt.hasPriors,
        expectedTAT: tt.expectedTAT.toString(),
        price: tt.price.toString(),
        payout: tt.physicianPayout.toString(),
      })
    }
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!isFormValid) { setFormError('Please fill in all required fields'); return }
    setSaving(true)
    setFormError(null)
    try {
      if (editingId) {
        await clientTypeStore.updateClientType(parseTaskTypeId(editingId), {
          expectedTAT: parseFloat(formData.expectedTAT),
          price: parseFloat(formData.price),
          physicianPayout: parseFloat(formData.payout),
        } as ClientTypeUpdateData)
      } else {
        await clientTypeStore.createClientType({
          clientId: parseInt(formData.clientId!),
          modality: formData.modality!,
          bodyArea: formData.bodyArea!,
          hasPriors: formData.hasPriors,
          expectedTAT: parseFloat(formData.expectedTAT),
          price: parseFloat(formData.price),
          physicianPayout: parseFloat(formData.payout),
        } as ClientTypeCreateData)
      }
      setDialogOpen(false)
      await clientTypeStore.fetchClientTypes()
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save task type')
    } finally {
      setSaving(false)
    }
  }

  function handleDialogClose() {
    if (!saving) { setDialogOpen(false); resetForm() }
  }

  async function handleDeleteConfirm() {
    if (!taskTypeToDelete) return
    setDeleting(true)
    try {
      await clientTypeStore.deleteClientType(parseTaskTypeId(taskTypeToDelete.id))
      setDeleteDialogOpen(false)
      setTaskTypeToDelete(null)
      await clientTypeStore.fetchClientTypes()
    } catch (err) {
      console.error('Failed to delete task type:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('taskTypes.title')}
        subtitle={loading ? t('common.loading') : t('taskTypes.subtitle', { count: pagination.total })}
        actions={
          <Button size="sm" onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            {t('taskTypes.addTaskType')}
          </Button>
        }
      />

      {loading && <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" /></div>}
      {!loading && error && <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{error}</div>}

      {!loading && !error && (
        <div className="clinical-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('taskTypes.headers.client')}</th>
                <th>{t('taskTypes.headers.modality')}</th>
                <th>{t('taskTypes.headers.bodyArea')}</th>
                <th>{t('taskTypes.headers.priors')}</th>
                <th>{t('taskTypes.headers.expectedTat')}</th>
                <th>{t('taskTypes.headers.price')}</th>
                <th>{t('taskTypes.headers.payout')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clientTypes.map(ct => (
                <tr key={ct.id}>
                  <td className="text-sm font-medium">{ct.client}</td>
                  <td className="text-sm">{ct.modality}</td>
                  <td className="text-sm">{ct.bodyArea}</td>
                  <td>
                    <span className={`status-badge ${ct.hasPriors ? 'status-assigned' : 'status-new'}`}>
                      {ct.hasPriors ? t('common.yes') : t('common.no')}
                    </span>
                  </td>
                  <td className="text-sm">{t('taskTypes.hours', { count: ct.expectedTAT })}</td>
                  <td className="text-sm font-medium">${ct.price}</td>
                  <td className="text-sm">${ct.physicianPayout}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ct.id)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setTaskTypeToDelete(ct); setDeleteDialogOpen(true) }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingId ? t('taskTypes.dialog.titleEdit') : t('taskTypes.dialog.titleNew')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('taskTypes.dialog.client')}</Label>
              <Select
                value={formData.clientId ?? ''}
                onValueChange={val => setFormData(f => ({ ...f, clientId: val }))}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? t('common.loading') : t('taskTypes.dialog.clientPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('taskTypes.dialog.modality')}</Label>
                <Select
                  value={formData.modality ?? ''}
                  onValueChange={val => setFormData(f => ({ ...f, modality: val as Modality }))}
                >
                  <SelectTrigger><SelectValue placeholder={t('common.filter')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CT">{t('modality.ct')}</SelectItem>
                    <SelectItem value="MRI">{t('modality.mri')}</SelectItem>
                    <SelectItem value="X-Ray">{t('modality.xray')}</SelectItem>
                    <SelectItem value="US">{t('modality.us')}</SelectItem>
                    <SelectItem value="PET">{t('modality.pet')}</SelectItem>
                    <SelectItem value="NM">{t('modality.nm')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('taskTypes.dialog.bodyArea')}</Label>
                <Select
                  value={formData.bodyArea ?? ''}
                  onValueChange={val => setFormData(f => ({ ...f, bodyArea: val as BodyArea }))}
                >
                  <SelectTrigger><SelectValue placeholder={t('common.filter')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Head">{t('bodyArea.head')}</SelectItem>
                    <SelectItem value="Neck">{t('bodyArea.neck')}</SelectItem>
                    <SelectItem value="Chest">{t('bodyArea.chest')}</SelectItem>
                    <SelectItem value="Abdomen">{t('bodyArea.abdomen')}</SelectItem>
                    <SelectItem value="Pelvis">{t('bodyArea.pelvis')}</SelectItem>
                    <SelectItem value="Spine">{t('bodyArea.spine')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="hasPriors"
                checked={formData.hasPriors}
                onCheckedChange={val => setFormData(f => ({ ...f, hasPriors: !!val }))}
              />
              <Label htmlFor="hasPriors" className="text-sm font-normal">{t('taskTypes.dialog.includesPriors')}</Label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{t('taskTypes.dialog.tat')}</Label>
                <Input
                  type="number" min="0" placeholder="4"
                  value={formData.expectedTAT}
                  onChange={e => setFormData(f => ({ ...f, expectedTAT: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('taskTypes.dialog.price')}</Label>
                <Input
                  type="number" min="0" step="0.01" placeholder="150"
                  value={formData.price}
                  onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('taskTypes.dialog.payout')}</Label>
                <Input
                  type="number" min="0" step="0.01" placeholder="75"
                  value={formData.payout}
                  onChange={e => setFormData(f => ({ ...f, payout: e.target.value }))}
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{formError}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose} disabled={saving}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !isFormValid}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!deleting) setDeleteDialogOpen(open) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('taskTypes.deleteConfirm.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{t('taskTypes.deleteConfirm.message')}</p>
            {taskTypeToDelete && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">{taskTypeToDelete.client}</p>
                <p className="text-sm text-gray-600">{taskTypeToDelete.modality} - {taskTypeToDelete.bodyArea}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
