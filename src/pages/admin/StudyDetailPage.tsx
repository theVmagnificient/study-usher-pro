import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, UserPlus, History, Link2, FileText, CheckCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DeadlineTimer } from '@/components/ui/DeadlineTimer'
import { ElapsedTimer } from '@/components/ui/ElapsedTimer'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { getLinkedStudies } from '@/utils/linkedStudies'
import { useAuditStore } from '@/stores/auditStore'
import { useTaskStore } from '@/stores/taskStore'
import { userService } from '@/services/userService'
import { studyService } from '@/services/studyService'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api/client'
import { parseUserId } from '@/lib/mappers/utils'
import { cn } from '@/lib/utils'
import type { PriorStudy, Physician } from '@/types/study'

function ReportSection({ label, ru: ruText, en: enText, noText }: { label: string; ru?: string; en?: string; noText: string }) {
  if (!ruText && !enText) {
    return (
      <div>
        <label className="section-header">{label}</label>
        <p className="text-sm text-muted-foreground italic">{noText}</p>
      </div>
    )
  }
  return (
    <div>
      <label className="section-header">{label}</label>
      <div className={cn('mt-2 grid gap-4', ruText && enText ? 'grid-cols-2' : 'grid-cols-1')}>
        {ruText && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">RU</p>
            <p className="text-sm whitespace-pre-wrap">{ruText}</p>
          </div>
        )}
        {enText && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">EN</p>
            <p className="text-sm whitespace-pre-wrap">{enText}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudyDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const auditStore = useAuditStore()
  const taskStore = useTaskStore()

  const [selectedPrior, setSelectedPrior] = useState<PriorStudy | null>(null)
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [selectedRadiologistId, setSelectedRadiologistId] = useState<number | null>(null)
  const [reassignComment, setReassignComment] = useState('')
  const [reassigning, setReassigning] = useState(false)
  const [markingDelivered, setMarkingDelivered] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOpeningViewer, setIsOpeningViewer] = useState(false)
  const [reportingRadiologists, setReportingRadiologists] = useState<Physician[]>([])
  const [validatingRadiologists, setValidatingRadiologists] = useState<Physician[]>([])

  const study = taskStore.currentTask
  const linkedStudies = study
    ? getLinkedStudies(study, [...taskStore.myReportingTasks, ...taskStore.myValidationTasks])
    : []
  const studyAuditLog = study
    ? auditStore.auditLog.filter(l => l.studyId === study.id)
    : []

  const isValidationStatus = study?.status === 'assigned-for-validation' || study?.status === 'under-validation'
  const availableRadiologists = {
    reporting: isValidationStatus ? [] : reportingRadiologists,
    validating: validatingRadiologists,
  }

  const canReassign = study ? ['new', 'assigned', 'translated'].includes(study.status) : false

  const fetchRadiologists = useCallback(async () => {
    try {
      const response = await userService.getAll(1, 100)
      const users = response.items || []
      setReportingRadiologists(users.filter((u: any) => u.role === 'reporting-radiologist'))
      setValidatingRadiologists(users.filter((u: any) => u.role === 'validating-radiologist'))
    } catch (err) {
      console.error('Failed to fetch radiologists:', err)
    }
  }, [])

  useEffect(() => {
    const id = parseInt(taskId!, 10)
    Promise.all([
      taskStore.fetchTaskDetails(id),
      auditStore.fetchAuditLog(),
      fetchRadiologists(),
    ])
  }, [taskId])

  const handleReassign = async () => {
    if (!study || !selectedRadiologistId) return
    setReassigning(true)
    try {
      const { taskId: tId } = study
      const selectedUser = [...reportingRadiologists, ...validatingRadiologists]
        .find(u => parseUserId(u.id) === selectedRadiologistId)

      let endpoint = ''
      if (selectedUser?.role === 'validating-radiologist') {
        endpoint = `/api/v1/admin/tasks/${tId}/assign-validation`
      } else if (study.status === 'new') {
        endpoint = `/api/v1/admin/tasks/${tId}/assign-reporting`
      } else {
        endpoint = `/api/v1/admin/tasks/${tId}/reassign`
      }

      await (apiClient as any).post(endpoint, {
        radiologist_id: selectedRadiologistId,
        comment: reassignComment || 'Reassigned by admin',
      })
      await taskStore.fetchTaskDetails(tId)
      await auditStore.fetchAuditLog()
      setShowReassignDialog(false)
      setSelectedRadiologistId(null)
      setReassignComment('')
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to reassign task'
      if (msg.includes('assigned_for_validation to assigned_for_validation')) {
        alert('Cannot reassign validators once task is already assigned for validation.')
      } else {
        alert(msg)
      }
    } finally {
      setReassigning(false)
    }
  }

  const handleDownload = async () => {
    if (!study || isDownloading) return
    setIsDownloading(true)
    try {
      await studyService.downloadStudy(study.studyId)
      toast({ title: t('reporting.downloadStarted'), description: t('reporting.downloadDescription') })
    } catch (err: any) {
      toast({ title: t('reporting.downloadFailed'), description: err.message, variant: 'destructive' })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOpenViewer = async () => {
    if (!study || isOpeningViewer) return
    setIsOpeningViewer(true)
    try {
      await studyService.openViewer(study.studyId)
    } catch (err: any) {
      toast({ title: t('reporting.viewerFailed'), description: err.message, variant: 'destructive' })
    } finally {
      setIsOpeningViewer(false)
    }
  }

  const handleMarkDelivered = async () => {
    if (!study) return
    setMarkingDelivered(true)
    try {
      await taskStore.markTaskDelivered(study.taskId)
      await taskStore.fetchTaskDetails(study.taskId)
      await auditStore.fetchAuditLog()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark task as delivered')
    } finally {
      setMarkingDelivered(false)
    }
  }

  if (taskStore.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }
  if (taskStore.error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{taskStore.error}</div>
  }
  if (!study) return null

  return (
    <TooltipProvider>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{study.accessionNumber}</h1>
              <StatusBadge status={study.status} />
              <UrgencyBadge urgency={study.urgency} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {study.clientName} • {study.modality} {study.bodyArea}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {study.status !== 'delivered' && <DeadlineTimer deadline={study.deadline} />}
            <ElapsedTimer
              startTime={study.receivedAt}
              endTime={study.status === 'delivered' ? study.updatedAt : undefined}
            />
            <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              <Download className={cn('w-4 h-4 mr-2', isDownloading && 'animate-bounce')} />
              {isDownloading ? t('reporting.downloading') : t('studyDetail.dicom')}
            </Button>
            <Button variant="outline" onClick={handleOpenViewer} disabled={isOpeningViewer}>
              <Eye className={cn('w-4 h-4 mr-2', isOpeningViewer && 'animate-pulse')} />
              {isOpeningViewer ? t('reporting.openingViewer') : t('reporting.viewer')}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={() => setShowReassignDialog(true)}
                    disabled={!canReassign}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('studyList.reassign')}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canReassign && (
                <TooltipContent>
                  <p>Cannot reassign tasks that have progressed beyond assignment</p>
                </TooltipContent>
              )}
            </Tooltip>
            {study.status === 'finalized' && (
              <Button variant="default" onClick={handleMarkDelivered} disabled={markingDelivered}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {markingDelivered ? t('studyDetail.markingDelivered') : t('studyDetail.markDelivered')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="col-span-2 space-y-6">
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('studyDetail.studyInformation')}</h3>
              </div>
              <div className="clinical-card-body">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="section-header">{t('studyDetail.patientId')}</label>
                    <p className="text-sm font-mono">{study.patientId}</p>
                  </div>
                  <div>
                    <label className="section-header">{t('studyDetail.sexAge')}</label>
                    <p className="text-sm">{study.sex} / {study.age} years</p>
                  </div>
                  <div>
                    <label className="section-header">{t('studyDetail.received')}</label>
                    <p className="text-sm">{format(new Date(study.receivedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <label className="section-header">{t('studyDetail.modality')}</label>
                    <p className="text-sm">{study.modality}</p>
                  </div>
                  <div>
                    <label className="section-header">{t('studyDetail.bodyArea')}</label>
                    <p className="text-sm">{study.bodyArea}</p>
                  </div>
                  <div>
                    <label className="section-header">{t('studyDetail.assignedTo')}</label>
                    <p className="text-sm">{study.assignedPhysician || t('common.unassigned')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('studyDetail.currentReport')}</h3>
              </div>
              <div className="clinical-card-body space-y-4">
                <ReportSection
                  label={t('studyDetail.protocol')}
                  ru={study.report?.protocol}
                  en={study.report?.protocolEn}
                  noText={t('studyDetail.noProtocol')}
                />
                <ReportSection
                  label={t('studyDetail.findings')}
                  ru={study.report?.findings}
                  en={study.report?.findingsEn}
                  noText={t('studyDetail.noFindings')}
                />
                <ReportSection
                  label={t('studyDetail.impression')}
                  ru={study.report?.impression}
                  en={study.report?.impressionEn}
                  noText={t('studyDetail.noImpression')}
                />
              </div>
            </div>

            {study.validatorComments && study.validatorComments.length > 0 && (
              <div className="clinical-card">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold">{t('studyDetail.validatorComments')}</h3>
                  <span className="text-xs text-muted-foreground">
                    {t('studyDetail.commentCount', { count: study.validatorComments.length })}
                  </span>
                </div>
                <div className="clinical-card-body space-y-3">
                  {study.validatorComments.map(comment => (
                    <div key={comment.id} className="p-3 bg-amber-500/10 rounded-lg border-l-4 border-amber-500/30">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium">{comment.validatorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(comment.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {study.hasPriors && (
              <div className="clinical-card">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold">{t('studyDetail.priorStudies')}</h3>
                  <span className="text-xs text-muted-foreground">
                    {t('studyDetail.available', { count: study.priorCount })}
                  </span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('studyDetail.type')}</th>
                      <th>{t('studyDetail.date')}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {study.priorStudies?.map(prior => (
                      <tr key={prior.id}>
                        <td className="text-sm font-medium">{prior.type}</td>
                        <td className="text-sm text-muted-foreground">
                          {format(new Date(prior.date), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setSelectedPrior(prior)}
                            disabled={!prior.protocol && !prior.protocolEn && !prior.findings && !prior.findingsEn && !prior.impression && !prior.impressionEn && !prior.reportText}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {t('studyDetail.report')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => studyService.downloadStudy(prior.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            {t('studyDetail.dicom')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => studyService.openViewer(prior.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {t('studyDetail.viewer')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-1 space-y-6">
            {linkedStudies.length > 0 && (
              <div className="clinical-card border-primary/30 bg-primary/5">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    {t('studyDetail.linkedBodyParts')}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {t('studyDetail.zones', { count: linkedStudies.length + 1 })}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  <div className="p-3 bg-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{study.bodyArea}</p>
                        <p className="text-xs text-muted-foreground font-mono">{study.accessionNumber}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                        {t('studyDetail.current')}
                      </span>
                    </div>
                  </div>
                  {linkedStudies.map(linked => (
                    <button
                      key={linked.id}
                      onClick={() => navigate(`/task/${linked.id}`)}
                      className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{linked.bodyArea}</p>
                          <p className="text-xs text-muted-foreground font-mono">{linked.accessionNumber}</p>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded font-medium',
                          (linked.status === 'finalized' || linked.status === 'delivered')
                            ? 'bg-status-finalized/20 text-status-finalized'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {linked.status.replace('-', ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <History className="w-4 h-4" />
                  {t('studyDetail.history')}
                </h3>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {studyAuditLog.length > 0 ? (
                  studyAuditLog.map(entry => (
                    <div key={entry.id} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.timestamp), 'HH:mm')}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.user}</p>
                      {entry.previousStatus && entry.newStatus && (
                        <div className="flex items-center gap-1 mt-2">
                          <StatusBadge status={entry.previousStatus} />
                          <span className="text-muted-foreground text-xs">→</span>
                          <StatusBadge status={entry.newStatus} />
                        </div>
                      )}
                      {entry.comment && (
                        <p className="text-xs text-muted-foreground mt-2 italic">"{entry.comment}"</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    {t('studyDetail.noHistory')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reassign Dialog */}
        <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('studyDetail.reassignDialog.title')}</DialogTitle>
              <p className="text-sm text-muted-foreground">{t('studyDetail.reassignDialog.description')}</p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="section-header">{t('studyDetail.reassignDialog.selectRadiologist')}</label>
                <select
                  value={selectedRadiologistId ?? ''}
                  onChange={e => setSelectedRadiologistId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">{t('studyDetail.reassignDialog.selectPlaceholder')}</option>
                  {availableRadiologists.reporting.length > 0 && (
                    <optgroup label={t('studyDetail.reassignDialog.reportingRadiologists')}>
                      {availableRadiologists.reporting.map(u => (
                        <option key={u.id} value={parseUserId(u.id)}>
                          {u.fullName} ({u.activeStudies} active tasks)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableRadiologists.validating.length > 0 && (
                    <optgroup label={t('studyDetail.reassignDialog.validatingRadiologists')}>
                      {availableRadiologists.validating.map(u => (
                        <option key={u.id} value={parseUserId(u.id)}>
                          {u.fullName} ({u.activeStudies} active tasks)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="section-header">{t('studyDetail.reassignDialog.comment')}</label>
                <textarea
                  value={reassignComment}
                  onChange={e => setReassignComment(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[80px]"
                  placeholder={t('studyDetail.reassignDialog.commentPlaceholder')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleReassign} disabled={!selectedRadiologistId || reassigning}>
                {reassigning ? t('studyDetail.reassignDialog.reassigning') : t('studyDetail.reassignDialog.confirm')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Prior Report Dialog */}
        <Dialog open={!!selectedPrior} onOpenChange={open => { if (!open) setSelectedPrior(null) }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('studyDetail.priorReportDialog.title')} - {selectedPrior?.type}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{selectedPrior?.date}</p>
            </DialogHeader>
            {selectedPrior && (
              <div className="space-y-4 mt-4">
                {(selectedPrior.protocol || selectedPrior.protocolEn) && (
                  <ReportSection
                    label={t('studyDetail.protocol')}
                    ru={selectedPrior.protocol}
                    en={selectedPrior.protocolEn}
                    noText=""
                  />
                )}
                {(selectedPrior.findings || selectedPrior.findingsEn) && (
                  <ReportSection
                    label={t('studyDetail.findings')}
                    ru={selectedPrior.findings}
                    en={selectedPrior.findingsEn}
                    noText=""
                  />
                )}
                {(selectedPrior.impression || selectedPrior.impressionEn) && (
                  <ReportSection
                    label={t('studyDetail.impression')}
                    ru={selectedPrior.impression}
                    en={selectedPrior.impressionEn}
                    noText=""
                  />
                )}
                {!selectedPrior.protocol && !selectedPrior.protocolEn && !selectedPrior.findings && !selectedPrior.findingsEn && !selectedPrior.impression && !selectedPrior.impressionEn && selectedPrior.reportText && (
                  <div>
                    <label className="section-header">{t('studyDetail.report')}</label>
                    <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedPrior.reportText}</p>
                    </div>
                  </div>
                )}
                {!selectedPrior.protocol && !selectedPrior.protocolEn && !selectedPrior.findings && !selectedPrior.findingsEn && !selectedPrior.impression && !selectedPrior.impressionEn && !selectedPrior.reportText && (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{t('studyDetail.noProtocol')}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
