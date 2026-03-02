import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Calendar, Clock, CalendarClock, Shield, Search, Trash2 } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/study'

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  'reporting-radiologist': 'bg-primary/10 text-primary border-primary/20',
  'validating-radiologist': 'bg-status-finalized/10 text-status-finalized border-status-finalized/20',
}

export default function UserManagementPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userStore = useUserStore()
  const users = userStore.users
  const loading = userStore.loading
  const error = userStore.error

  const roleLabels: Record<UserRole, string> = {
    admin: t('roles.admin'),
    'reporting-radiologist': t('roles.reportingRadiologist'),
    'validating-radiologist': t('roles.validatingRadiologist'),
  }

  const [selectedPhysician, setSelectedPhysician] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingPhysician, setEditingPhysician] = useState<string | null>(null)
  const [deletingPhysician, setDeletingPhysician] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'reporting-radiologist' as UserRole,
  })

  useEffect(() => { userStore.fetchUsers() }, [])

  const filteredPhysicians = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return users.filter(p =>
      p.fullName.toLowerCase().includes(q) || p.id.toString().toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  const selected = useMemo(() =>
    users.find(p => p.id === selectedPhysician), [users, selectedPhysician])

  const handleRoleChange = useCallback(async (physicianId: string, newRole: UserRole) => {
    const physician = users.find(p => p.id === physicianId)
    if (physician) {
      await userStore.updateUser(parseInt(physician.id), { role: newRole })
    }
  }, [users])

  const handleNew = () => {
    setEditingPhysician(null)
    setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'reporting-radiologist' })
    setIsDialogOpen(true)
  }

  const handleEdit = (physicianId: string) => {
    const physician = users.find(p => p.id === physicianId)
    if (physician) {
      setEditingPhysician(physicianId)
      const [firstName, ...rest] = physician.fullName.split(' ')
      setFormData({
        firstName: firstName || '',
        lastName: rest.join(' ') || '',
        email: physician.email || '',
        password: '',
        role: physician.role,
      })
      setIsDialogOpen(true)
    }
  }

  const handleDelete = (physicianId: string) => {
    setDeletingPhysician(physicianId)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (editingPhysician) {
      const physician = users.find(p => p.id === editingPhysician)
      if (physician) {
        await userStore.updateUser(parseInt(physician.id), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
        })
      }
    } else {
      if (!formData.password || formData.password.length < 6) {
        alert('Password must be at least 6 characters long')
        return
      }
      await userStore.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })
    }
    setIsDialogOpen(false)
  }

  const confirmDelete = async () => {
    if (!deletingPhysician) return
    setIsDeleting(true)
    try {
      const physician = users.find(p => p.id === deletingPhysician)
      if (physician) {
        await userStore.deleteUser(parseInt(physician.id))
        setIsDeleteDialogOpen(false)
        setDeletingPhysician(null)
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert('Failed to delete user. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('userManagement.title')}
        subtitle={loading ? t('common.loading') : t('userManagement.subtitle', { count: users.length })}
        actions={
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            {t('userManagement.addPhysician')}
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{error}</div>
      ) : null}

      <div className="grid grid-cols-3 gap-6">
        {/* Physician List */}
        <div className="col-span-2">
          <div className="clinical-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('userManagement.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('userManagement.headers.physician')}</th>
                  <th>{t('userManagement.headers.role')}</th>
                  <th>{t('userManagement.headers.contact')}</th>
                  <th>{t('userManagement.headers.modalities')}</th>
                  <th>{t('userManagement.headers.workload')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredPhysicians.map(physician => (
                  <tr
                    key={physician.id}
                    className={cn('cursor-pointer', selectedPhysician === physician.id && 'bg-accent')}
                    onClick={() => setSelectedPhysician(physician.id)}
                  >
                    <td>
                      <div className="font-medium text-sm">{physician.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('userManagement.studiesCompleted', { count: physician.statistics.total })}
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <Select
                        value={physician.role}
                        onValueChange={val => handleRoleChange(physician.id, val as UserRole)}
                      >
                        <SelectTrigger className={cn('w-[180px] h-8 text-xs border', roleBadgeColors[physician.role])}>
                          <Shield className="w-3 h-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                              {t('roles.admin')}
                            </div>
                          </SelectItem>
                          <SelectItem value="reporting-radiologist">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              {t('roles.reportingRadiologist')}
                            </div>
                          </SelectItem>
                          <SelectItem value="validating-radiologist">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-status-finalized" />
                              {t('roles.validatingRadiologist')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <div className="text-sm">{physician.phone}</div>
                      {physician.telegram && (
                        <div className="text-xs text-muted-foreground">{physician.telegram}</div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {physician.supportedModalities.map(m => (
                          <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'text-sm font-medium',
                          physician.activeStudies >= physician.maxActiveStudies && 'text-destructive'
                        )}>
                          {physician.activeStudies}/{physician.maxActiveStudies}
                        </div>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              physician.activeStudies >= physician.maxActiveStudies ? 'bg-destructive' : 'bg-primary'
                            )}
                            style={{ width: `${(physician.activeStudies / physician.maxActiveStudies) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => navigate(`/schedule/${physician.id}`)}
                          title={t('userManagement.manageSchedule')}
                        >
                          <CalendarClock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => handleEdit(physician.id)}
                          title={t('userManagement.editPhysician')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(physician.id)}
                          title={t('userManagement.deletePhysician')}
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
        </div>

        {/* Details Panel */}
        <div className="col-span-1">
          {selected ? (
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{selected.fullName}</h3>
                <Badge variant="outline" className={cn('text-xs', roleBadgeColors[selected.role])}>
                  {roleLabels[selected.role]}
                </Badge>
              </div>
              <div className="clinical-card-body space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="section-header">{t('userManagement.defaultSchedule')}</h4>
                    <Button
                      variant="ghost" size="sm" className="h-7 text-xs"
                      onClick={() => navigate(`/schedule/${selected.id}`)}
                    >
                      <CalendarClock className="w-3 h-3 mr-1" />
                      {t('userManagement.manage')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{selected.schedule.days.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selected.schedule.hours.start} - {selected.schedule.hours.end}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="section-header">{t('userManagement.bodyAreas')}</h4>
                  <div className="flex flex-wrap gap-1">
                    {selected.supportedBodyAreas.map(area => (
                      <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="section-header">{t('userManagement.statisticsByModality')}</h4>
                  <div className="space-y-2">
                    {Object.entries(selected.statistics.byModality)
                      .filter(([, count]) => (count as number) > 0)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([modality, count]) => (
                        <div key={modality} className="flex items-center justify-between text-sm">
                          <span>{modality}</span>
                          <span className="font-medium">{(count as number).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="clinical-card p-8 text-center text-muted-foreground">
              <p className="text-sm">{t('userManagement.selectPhysician')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPhysician ? t('userManagement.editDialog.titleEdit') : t('userManagement.editDialog.titleAdd')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('userManagement.editDialog.firstName')}</Label>
                <Input
                  value={formData.firstName}
                  onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                  placeholder={t('userManagement.editDialog.firstNamePlaceholder')}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('userManagement.editDialog.lastName')}</Label>
                <Input
                  value={formData.lastName}
                  onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                  placeholder={t('userManagement.editDialog.lastNamePlaceholder')}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('userManagement.editDialog.email')}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                placeholder={t('userManagement.editDialog.emailPlaceholder')}
              />
            </div>
            {!editingPhysician && (
              <div className="grid gap-2">
                <Label>{t('userManagement.editDialog.password')}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('userManagement.editDialog.passwordPlaceholder')}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>{t('userManagement.editDialog.role')}</Label>
              <Select value={formData.role} onValueChange={val => setFormData(f => ({ ...f, role: val as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                  <SelectItem value="reporting-radiologist">{t('roles.reportingRadiologist')}</SelectItem>
                  <SelectItem value="validating-radiologist">{t('roles.validatingRadiologist')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>
              {editingPhysician ? t('userManagement.editDialog.update') : t('userManagement.editDialog.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('userManagement.deleteDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{t('userManagement.deleteDialog.message')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t('common.deleting') : t('userManagement.deleteDialog.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
