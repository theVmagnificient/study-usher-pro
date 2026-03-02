import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Download, Save, Send, ChevronRight, FileText, AlertTriangle,
  MessageSquare, CheckCircle, RotateCcw, Link2, X, History, ChevronUp,
  ChevronDown, MessageCircle, Languages, FileEdit, Eye, PictureInPicture2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DeadlineTimer } from '@/components/ui/DeadlineTimer'
import { TemplatePopup } from '@/components/ui/TemplatePopup'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import { getLinkedStudies } from '@/utils/linkedStudies'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { studyService } from '@/services/studyService'
import { usePictureInPicture } from '@/hooks/usePictureInPicture'
import { useSlashTemplates } from '@/hooks/useSlashTemplates'
import { findingsTemplates, impressionTemplates } from '@/data/reportTemplates'
import type { PriorStudy } from '@/types/study'

interface Props {
  pipMode?: boolean
}

export default function ReportingPage({ pipMode = false }: Props) {
  const { taskId: taskIdParam } = useParams<{ taskId?: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const taskStore = useTaskStore()
  const authStore = useAuthStore()

  const numericTaskId = taskIdParam ? parseInt(taskIdParam, 10) : NaN

  const study = useMemo(() => {
    if (!taskStore.currentTask) return null
    if (pipMode) return taskStore.currentTask
    if (taskStore.currentTask.taskId === numericTaskId) return taskStore.currentTask
    return null
  }, [taskStore.currentTask, numericTaskId, pipMode])

  const linkedStudies = useMemo(() =>
    study ? getLinkedStudies(study, taskStore.myReportingTasks) : [],
    [study, taskStore.myReportingTasks]
  )
  const priorStudies = study?.priorStudies || []

  // Report fields — local state synced from study
  const [protocol, setProtocol] = useState('')
  const [findings, setFindings] = useState('')
  const [impression, setImpression] = useState('')
  const [englishProtocol, setEnglishProtocol] = useState('')
  const [englishFindings, setEnglishFindings] = useState('')
  const [englishImpression, setEnglishImpression] = useState('')

  useEffect(() => {
    if (study?.report) {
      setProtocol(study.report.protocol || '')
      setFindings(study.report.findings || '')
      setImpression(study.report.impression || '')
      setEnglishProtocol(study.report.protocolEn || '')
      setEnglishFindings(study.report.findingsEn || '')
      setEnglishImpression(study.report.impressionEn || '')
    }
  }, [study?.taskId])

  const isValidator = authStore.isValidatingRadiologist()
  const isTaskCompleted = study ? ['finalized', 'delivered'].includes(study.status) : false
  const isTaskWithValidator = study ? ['assigned-for-validation', 'under-validation'].includes(study.status) : false
  const isReadonly = isTaskCompleted || (isTaskWithValidator && !isValidator)

  const sortedComments = useMemo(() => {
    if (!study?.validatorComments) return []
    return [...study.validatorComments].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [study?.validatorComments])

  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [selectedPrior, setSelectedPrior] = useState<PriorStudy | null>(null)
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [validatorComment, setValidatorComment] = useState('')
  const [isSavingValidatorChanges, setIsSavingValidatorChanges] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editProtocol, setEditProtocol] = useState('')
  const [editFindings, setEditFindings] = useState('')
  const [editImpression, setEditImpression] = useState('')
  const [editProtocolEn, setEditProtocolEn] = useState('')
  const [editFindingsEn, setEditFindingsEn] = useState('')
  const [editImpressionEn, setEditImpressionEn] = useState('')
  const [editComment, setEditComment] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOpeningViewer, setIsOpeningViewer] = useState(false)

  const hasEditChanges = editProtocol.trim() || editFindings.trim() || editImpression.trim() ||
    editProtocolEn.trim() || editFindingsEn.trim() || editImpressionEn.trim()

  // PiP
  const { pipSupported, isPipOpen, isOpeningPip, togglePictureInPicture, closePip } = usePictureInPicture({
    canOpen: () => !!study,
    getWindowTitle: () => study?.accessionNumber ?? String(study?.id ?? 'Report'),
    loadShell: () => import('./PipShell').then(m => m.default),
  }, pipMode)

  // Slash templates
  const findingsRef = useRef<HTMLTextAreaElement>(null)
  const impressionRef = useRef<HTMLTextAreaElement>(null)

  const findingsSlash = useSlashTemplates({
    templates: findingsTemplates,
    value: findings,
    textareaRef: findingsRef,
    onUpdate: setFindings,
  })
  const impressionSlash = useSlashTemplates({
    templates: impressionTemplates,
    value: impression,
    textareaRef: impressionRef,
    onUpdate: setImpression,
  })

  // Load task on mount and route change
  useEffect(() => {
    if (pipMode || isNaN(numericTaskId)) return
    taskStore.fetchTaskDetails(numericTaskId).then(async () => {
      if (isValidator) {
        setShowEnglishTranslation(true)
        const s = taskStore.currentTask
        if (s?.status === 'assigned-for-validation') {
          try {
            await taskStore.startValidationTask(numericTaskId)
            await taskStore.fetchTaskDetails(numericTaskId)
          } catch (err) {
            console.error('Failed to auto-start validation:', err)
          }
        }
      }
    })
  }, [numericTaskId])

  const handleBack = () => navigate(-1)

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

  const handleSaveDraft = async () => {
    if (!study) return
    try {
      if (study.status === 'new') {
        await taskStore.takeTask(study.taskId)
        await taskStore.startTask(study.taskId)
      } else if (study.status === 'assigned' || study.status === 'returned') {
        await taskStore.startTask(study.taskId)
      }
      await taskStore.saveDraft(study.taskId, {
        protocol, findings, impression,
        protocol_en: englishProtocol, findings_en: englishFindings, impression_en: englishImpression,
      })
      toast({ title: t('reporting.draftSaved'), description: t('reporting.draftSavedDescription') })
    } catch (err) {
      console.error('Failed to save draft:', err)
      toast({ title: t('reporting.saveError'), description: t('reporting.saveErrorDescription'), variant: 'destructive' })
    }
  }

  const handleSubmit = async () => {
    if (!study) return
    try {
      if (study.status === 'new') {
        await taskStore.takeTask(study.taskId)
        await taskStore.fetchTaskDetails(study.taskId)
        await taskStore.startTask(study.taskId)
        await taskStore.fetchTaskDetails(study.taskId)
      } else if (study.status === 'assigned' || study.status === 'returned') {
        await taskStore.startTask(study.taskId)
        await taskStore.fetchTaskDetails(study.taskId)
      }
      await taskStore.submitReport(study.taskId, {
        protocol, findings, impression,
        protocol_en: englishProtocol, findings_en: englishFindings, impression_en: englishImpression,
      })
      setShowSubmitDialog(false)
      navigate(-1)
    } catch (err) {
      console.error('Failed to submit report:', err)
    }
  }

  const handleApprove = async () => {
    if (!study) return
    try {
      await taskStore.finalizeTask(study.taskId, validatorComment.trim() || undefined)
      navigate(-1)
    } catch (err) {
      console.error('Failed to finalize task:', err)
    }
  }

  const handleReturn = async () => {
    if (!study || !validatorComment.trim()) return
    try {
      await taskStore.returnForRevision(study.taskId, validatorComment)
      navigate(-1)
    } catch (err) {
      console.error('Failed to return task for revision:', err)
    }
  }

  const handleSaveValidatorChanges = async () => {
    if (!study) return
    setIsSavingValidatorChanges(true)
    try {
      await taskStore.editReportByValidator(study.taskId, {
        protocol, findings, impression,
        protocol_en: englishProtocol, findings_en: englishFindings, impression_en: englishImpression,
      })
      await taskStore.fetchTaskDetails(study.taskId)
      toast({ title: t('reporting.changesSaved'), description: t('reporting.changesSavedDescription') })
    } catch (err) {
      toast({ title: t('reporting.saveError'), description: t('reporting.saveErrorDescription'), variant: 'destructive' })
    } finally {
      setIsSavingValidatorChanges(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!study || !hasEditChanges) return
    try {
      const updates: Record<string, string> = {}
      if (editProtocol.trim()) updates.protocol = editProtocol
      if (editFindings.trim()) updates.findings = editFindings
      if (editImpression.trim()) updates.impression = editImpression
      if (editProtocolEn.trim()) updates.protocol_en = editProtocolEn
      if (editFindingsEn.trim()) updates.findings_en = editFindingsEn
      if (editImpressionEn.trim()) updates.impression_en = editImpressionEn
      await taskStore.editReportByValidator(study.taskId, updates)
      await taskStore.fetchTaskDetails(study.taskId)
      setShowEditDialog(false)
    } catch (err) {
      console.error('Failed to edit report:', err)
    }
  }

  const handlePriorClick = (prior: PriorStudy) => {
    const isDeselecting = selectedPrior?.id === prior.id
    setSelectedPrior(isDeselecting ? null : prior)
    if (isDeselecting) setShowEnglishTranslation(false)
  }

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const clinicalNotesText = study?.clinicalNotes || t('reporting.noClinicalNotes')
  const technicalNotesText = study?.technicalNotes || t('reporting.noTechnicalNotes')

  if (taskStore.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }
  if (taskStore.error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-md m-6">{taskStore.error}</div>
  }
  if (!study) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={cn('sticky top-0 z-10 bg-card border-b border-border', pipMode ? 'px-3 py-2' : 'px-4 py-3')}>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {!pipMode && (
              <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground truncate">{study.accessionNumber}</span>
                <StatusBadge status={study.status} />
                {!pipMode && <UrgencyBadge urgency={study.urgency} />}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-sm truncate">
                <span className="text-muted-foreground shrink-0">{study.patientId}</span>
                <span className="font-semibold text-foreground truncate">{study.modality} {study.bodyArea}</span>
                <span className="text-muted-foreground shrink-0">{study.sex}/{study.age}y</span>
              </div>
            </div>
          </div>

          {!pipMode ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {!['finalized', 'delivered'].includes(study.status) && (
                <DeadlineTimer deadline={study.deadline} />
              )}
              {linkedStudies.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      {t('reporting.dicom')}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      {t('reporting.downloadBodyArea', { area: study.bodyArea })}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      {t('reporting.downloadAll', { count: linkedStudies.length + 1 })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
                  <Download className={cn('w-4 h-4 mr-2', isDownloading && 'animate-bounce')} />
                  {isDownloading ? t('reporting.downloading') : t('reporting.dicom')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleOpenViewer} disabled={isOpeningViewer}>
                <Eye className={cn('w-4 h-4 mr-2', isOpeningViewer && 'animate-pulse')} />
                {isOpeningViewer ? t('reporting.openingViewer') : t('reporting.viewer')}
              </Button>
              {pipSupported && (
                <Button variant="outline" size="sm" onClick={togglePictureInPicture} disabled={isOpeningPip}>
                  <PictureInPicture2 className={cn('w-4 h-4 mr-2', isOpeningPip && 'animate-pulse')} />
                  {isPipOpen ? t('reporting.closePip') : t('reporting.openPip')}
                </Button>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" className="flex-shrink-0" onClick={closePip}>
              <PictureInPicture2 className="w-4 h-4 mr-1" />
              {t('reporting.closePip')}
            </Button>
          )}
        </div>
      </header>

      {/* Validator Comments (hidden in PiP) */}
      {!pipMode && study.validatorComments && study.validatorComments.length > 0 && (
        <div className="mx-4 mt-4">
          <button
            onClick={() => setCommentsExpanded(e => !e)}
            className="w-full clinical-card border-l-4 border-l-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer text-left"
          >
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                {t('reporting.comments')}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t('reporting.commentCount', { count: study.validatorComments.length })})
                </span>
              </h3>
              {commentsExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
            {!commentsExpanded && sortedComments[0] && (
              <div className="clinical-card-body">
                <div className="flex items-start gap-2">
                  {sortedComments[0].isAction
                    ? <FileEdit className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    : <MessageCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />}
                  <p className="text-sm text-foreground line-clamp-1 flex-1">{sortedComments[0].text}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  — {sortedComments[0].validatorName} • {formatTime(sortedComments[0].timestamp)}
                </p>
              </div>
            )}
          </button>
          {commentsExpanded && (
            <div className="mt-2 space-y-2">
              {study.validatorComments.map(comment => (
                <div
                  key={comment.id}
                  className={cn(
                    'clinical-card border-l-4',
                    comment.isCritical ? 'border-l-destructive bg-destructive/5'
                      : comment.isAction ? 'border-l-blue-500 bg-blue-500/5'
                      : 'border-l-orange-500 bg-orange-500/5'
                  )}
                >
                  <div className="clinical-card-body">
                    <div className="flex items-start gap-2">
                      {comment.isAction
                        ? <FileEdit className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        : <MessageCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />}
                      <p className="text-sm text-foreground whitespace-pre-line flex-1">{comment.text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      — {comment.validatorName} • {formatDate(comment.timestamp)} at {formatTime(comment.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clinical & Technical Notes */}
      <div className={cn('mx-4 mt-4 grid gap-4', pipMode ? 'grid-cols-1' : 'grid-cols-2')}>
        <button
          onClick={() => setNotesExpanded(e => !e)}
          className="clinical-card border-l-4 border-l-primary text-left w-full hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <div className="clinical-card-header">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t('reporting.clinicalNotes')}
            </h3>
            {notesExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="clinical-card-body">
            <p className={cn('text-sm text-foreground transition-all', !notesExpanded && 'line-clamp-2')}>
              {clinicalNotesText}
            </p>
          </div>
        </button>
        {isValidator && (
          <button
            onClick={() => setNotesExpanded(e => !e)}
            className="clinical-card border-l-4 border-l-muted-foreground text-left w-full hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                {t('reporting.technicalNotes')}
              </h3>
              {notesExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div className="clinical-card-body">
              <p className={cn('text-sm text-foreground transition-all', !notesExpanded && 'line-clamp-2')}>
                {technicalNotesText}
              </p>
            </div>
          </button>
        )}
      </div>

      <div className="flex">
        {/* Report Editor */}
        <div className={cn('flex-1 min-w-0 p-4', !pipMode && 'p-6')}>
          <div className={cn('space-y-4', !pipMode && 'space-y-6')}>
            {/* Headers Row */}
            <div className={cn('grid gap-4', pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6')}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">{t('reporting.currentReport')}</span>
                <span className="text-xs text-muted-foreground font-mono">{study.id}</span>
              </div>
              {!pipMode && (selectedPrior || showEnglishTranslation) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showEnglishTranslation
                      ? <Languages className="w-4 h-4 text-blue-500" />
                      : <History className="w-4 h-4 text-muted-foreground" />}
                    <span className={cn('text-sm font-semibold', showEnglishTranslation ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground')}>
                      {showEnglishTranslation ? t('reporting.englishTranslation') : t('reporting.priorReport')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {showEnglishTranslation ? t('reporting.manualTranslation') : `${selectedPrior?.type} • ${selectedPrior?.date}`}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (showEnglishTranslation) setShowEnglishTranslation(false)
                    else setSelectedPrior(null)
                  }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Protocol Row */}
            <div className={cn('grid gap-4', pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6')}>
              <div>
                <label className="field-label">{t('reporting.protocol')}</label>
                <Textarea
                  value={protocol}
                  onChange={e => setProtocol(e.target.value)}
                  className="report-textarea"
                  placeholder={t('reporting.protocolPlaceholder')}
                  readOnly={isReadonly}
                />
              </div>
              {!pipMode && showEnglishTranslation && (
                <div>
                  <label className="field-label text-blue-600 dark:text-blue-400">
                    {t('reporting.protocolEn')}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{t('reporting.protocolEnNote')}</span>
                  </label>
                  <Textarea
                    value={englishProtocol}
                    onChange={e => setEnglishProtocol(e.target.value)}
                    className="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                    placeholder={t('reporting.protocolEnPlaceholder')}
                    readOnly={isReadonly}
                  />
                </div>
              )}
              {!pipMode && selectedPrior && !showEnglishTranslation && (
                <div>
                  <label className="field-label text-muted-foreground">{t('reporting.protocol')}</label>
                  <div className="report-textarea bg-muted/50 space-y-2">
                    {selectedPrior.protocolEn && <p className="text-base font-medium">{selectedPrior.protocolEn}</p>}
                    {selectedPrior.protocol && <p className="text-xs text-muted-foreground">{selectedPrior.protocol}</p>}
                    {!selectedPrior.protocolEn && !selectedPrior.protocol && (
                      <p className="text-sm text-muted-foreground italic">{t('reporting.protocolNotAvailable')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Findings Row */}
            <div className={cn('grid gap-4', pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6')}>
              <div className="relative">
                <label className="field-label">{t('reporting.findings')}</label>
                <Textarea
                  ref={findingsRef}
                  value={findings}
                  onChange={e => setFindings(e.target.value)}
                  onKeyDown={findingsSlash.onKeydown}
                  onInput={findingsSlash.onInput}
                  className="report-textarea"
                  placeholder={t('reporting.findingsPlaceholder')}
                  readOnly={isReadonly}
                />
                <TemplatePopup
                  show={findingsSlash.showPopup}
                  templates={findingsSlash.filteredTemplates}
                  activeIndex={findingsSlash.activeIndex}
                  emptyText={t('reporting.templatePopup.noResults')}
                  onSelect={findingsSlash.selectTemplate}
                />
              </div>
              {!pipMode && showEnglishTranslation && (
                <div>
                  <label className="field-label text-blue-600 dark:text-blue-400">
                    {t('reporting.findingsEn')}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{t('reporting.protocolEnNote')}</span>
                  </label>
                  <Textarea
                    value={englishFindings}
                    onChange={e => setEnglishFindings(e.target.value)}
                    className="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                    placeholder={t('reporting.findingsEnPlaceholder')}
                    readOnly={isReadonly}
                  />
                </div>
              )}
              {!pipMode && selectedPrior && !showEnglishTranslation && (
                <div>
                  <label className="field-label text-muted-foreground">{t('reporting.findings')}</label>
                  <div className="report-textarea bg-muted/50 space-y-2">
                    {selectedPrior.findingsEn && <p className="text-base font-medium">{selectedPrior.findingsEn}</p>}
                    {selectedPrior.findings && <p className="text-xs text-muted-foreground">{selectedPrior.findings}</p>}
                    {selectedPrior.reportText && !selectedPrior.findings && (
                      <p className="text-xs text-muted-foreground">{selectedPrior.reportText}</p>
                    )}
                    {!selectedPrior.findingsEn && !selectedPrior.findings && !selectedPrior.reportText && (
                      <p className="text-sm text-muted-foreground italic">{t('reporting.findingsNotAvailable')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Impression Row */}
            <div className={cn('grid gap-4', pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6')}>
              <div className="relative">
                <label className="field-label">{t('reporting.impression')}</label>
                <Textarea
                  ref={impressionRef}
                  value={impression}
                  onChange={e => setImpression(e.target.value)}
                  onKeyDown={impressionSlash.onKeydown}
                  onInput={impressionSlash.onInput}
                  className="report-textarea"
                  placeholder={t('reporting.impressionPlaceholder')}
                  readOnly={isReadonly}
                />
                <TemplatePopup
                  show={impressionSlash.showPopup}
                  templates={impressionSlash.filteredTemplates}
                  activeIndex={impressionSlash.activeIndex}
                  emptyText={t('reporting.templatePopup.noResults')}
                  onSelect={impressionSlash.selectTemplate}
                />
              </div>
              {!pipMode && showEnglishTranslation && (
                <div>
                  <label className="field-label text-blue-600 dark:text-blue-400">
                    {t('reporting.impressionEn')}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{t('reporting.protocolEnNote')}</span>
                  </label>
                  <Textarea
                    value={englishImpression}
                    onChange={e => setEnglishImpression(e.target.value)}
                    className="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                    placeholder={t('reporting.impressionEnPlaceholder')}
                    readOnly={isReadonly}
                  />
                </div>
              )}
              {!pipMode && selectedPrior && !showEnglishTranslation && (
                <div>
                  <label className="field-label text-muted-foreground">{t('reporting.impression')}</label>
                  <div className="report-textarea bg-muted/50 space-y-2">
                    {selectedPrior.impressionEn && <p className="text-base font-medium">{selectedPrior.impressionEn}</p>}
                    {selectedPrior.impression && <p className="text-xs text-muted-foreground">{selectedPrior.impression}</p>}
                    {!selectedPrior.impressionEn && !selectedPrior.impression && (
                      <p className="text-sm text-muted-foreground italic">{t('reporting.impressionNotAvailable')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Validator Comment Input (hidden in PiP) */}
            {!pipMode && isValidator && (
              <div className="clinical-card border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/20">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {t('reporting.addValidatorComment')}
                  </h3>
                  <span className="text-xs text-muted-foreground">{t('reporting.validatorCommentNote')}</span>
                </div>
                <div className="clinical-card-body">
                  <Textarea
                    value={validatorComment}
                    onChange={e => setValidatorComment(e.target.value)}
                    className="report-textarea bg-background"
                    placeholder={t('reporting.validatorCommentPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={cn('grid gap-4 pt-4 border-t border-border', pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6')}>
              <div className="flex items-center justify-between">
                {isValidator ? (
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleReturn} disabled={!validatorComment.trim()}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t('reporting.returnForRevision')}
                    </Button>
                    <Button variant="outline" onClick={handleSaveValidatorChanges} disabled={isSavingValidatorChanges}>
                      {isSavingValidatorChanges
                        ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        : <Save className="w-4 h-4 mr-2" />}
                      {isSavingValidatorChanges ? t('reporting.saving') : t('reporting.saveChanges')}
                    </Button>
                    <Button onClick={handleApprove}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('reporting.finalizeReport')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isTaskWithValidator}>
                      <Save className="w-4 h-4 mr-2" />
                      {t('reporting.saveDraft')}
                    </Button>
                    {!isTaskCompleted && (
                      <Button onClick={() => setShowSubmitDialog(true)} disabled={isTaskWithValidator}>
                        <Send className="w-4 h-4 mr-2" />
                        {t('reporting.submitForValidation')}
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isTaskCompleted ? t('reporting.finalizedNote') : t('reporting.notAutoSaved')}
                </p>
              </div>
              {!pipMode && selectedPrior && (
                <div className="pt-4 border-t border-border flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => studyService.downloadStudy(selectedPrior.id)}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('reporting.dicom')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => studyService.openViewer(selectedPrior.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    {t('reporting.viewer')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (hidden in PiP) */}
        {!pipMode && (
          <aside className="w-72 border-l border-border bg-muted/30 p-4 space-y-4 flex-shrink-0">
            {linkedStudies.length > 0 && (
              <div className="clinical-card border-primary/30 bg-primary/5">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    {t('reporting.linkedBodyParts')}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {t('reporting.zones', { count: linkedStudies.length + 1 })}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  <div className="p-3 bg-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{study.bodyArea}</p>
                        <p className="text-xs text-muted-foreground font-mono">{study.id}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                        {t('reporting.current')}
                      </span>
                    </div>
                  </div>
                  {linkedStudies.map(linked => (
                    <button
                      key={linked.id}
                      onClick={() => navigate(`/report/${linked.id}`)}
                      className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{linked.bodyArea}</p>
                          <p className="text-xs text-muted-foreground font-mono">{linked.id}</p>
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

            {isValidator && (
              <div className="clinical-card border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Languages className="w-4 h-4 text-blue-500" />
                    {t('reporting.translation')}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowEnglishTranslation(e => !e)
                    if (showEnglishTranslation) setSelectedPrior(null)
                  }}
                  className={cn(
                    'w-full p-3 text-left transition-colors flex items-center justify-between',
                    showEnglishTranslation
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 border-l-2 border-l-blue-500'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{t('reporting.englishVersion')}</p>
                    <p className="text-xs text-muted-foreground">{t('reporting.manualTranslationRequired')}</p>
                  </div>
                  {showEnglishTranslation
                    ? <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('reporting.viewing')}</span>
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            )}

            {study.hasPriors && (
              <div className="clinical-card">
                <div className="clinical-card-header">
                  <h3 className="text-sm font-semibold">{t('reporting.priorStudies')}</h3>
                  <span className="text-xs text-muted-foreground">{priorStudies.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {priorStudies.map(prior => (
                    <button
                      key={prior.id}
                      onClick={() => handlePriorClick(prior)}
                      className={cn(
                        'w-full p-3 text-left transition-colors flex items-center justify-between',
                        selectedPrior?.id === prior.id
                          ? 'bg-primary/10 border-l-2 border-l-primary'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{prior.type}</p>
                        <p className="text-xs text-muted-foreground">{prior.date}</p>
                      </div>
                      {selectedPrior?.id === prior.id
                        ? <span className="text-xs text-primary font-medium">{t('reporting.viewing')}</span>
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reporting.submitDialog.title')}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t('reporting.submitDialog.description')}</p>
          </DialogHeader>
          <div className="p-4 bg-muted/50 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-urgency-urgent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{t('reporting.submitDialog.warning')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit}>{t('reporting.submitDialog.confirmSubmission')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Only the fields you modify will be updated. A new version will be created.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {(['protocol', 'findings', 'impression'] as const).map(field => (
              <div key={field}>
                <label className="field-label">{t(`reporting.${field}`)}</label>
                <Textarea
                  value={field === 'protocol' ? editProtocol : field === 'findings' ? editFindings : editImpression}
                  onChange={e => {
                    if (field === 'protocol') setEditProtocol(e.target.value)
                    else if (field === 'findings') setEditFindings(e.target.value)
                    else setEditImpression(e.target.value)
                  }}
                  className="report-textarea"
                  placeholder={field === 'protocol' ? protocol : field === 'findings' ? findings : impression}
                  rows={field === 'findings' ? 6 : 4}
                />
              </div>
            ))}
            {(englishProtocol || englishFindings || englishImpression) && (
              <div className="space-y-4 pt-4 border-t border-border">
                {(['protocolEn', 'findingsEn', 'impressionEn'] as const).map(field => (
                  <div key={field}>
                    <label className="field-label text-blue-600 dark:text-blue-400">{t(`reporting.${field}`)}</label>
                    <Textarea
                      value={field === 'protocolEn' ? editProtocolEn : field === 'findingsEn' ? editFindingsEn : editImpressionEn}
                      onChange={e => {
                        if (field === 'protocolEn') setEditProtocolEn(e.target.value)
                        else if (field === 'findingsEn') setEditFindingsEn(e.target.value)
                        else setEditImpressionEn(e.target.value)
                      }}
                      className="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                      placeholder={field === 'protocolEn' ? englishProtocol : field === 'findingsEn' ? englishFindings : englishImpression}
                      rows={field === 'findingsEn' ? 6 : 4}
                    />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="field-label">Comment (optional)</label>
              <Textarea
                value={editComment}
                onChange={e => setEditComment(e.target.value)}
                className="report-textarea"
                placeholder="Add a comment about your changes..."
                rows={2}
              />
            </div>
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-md border border-amber-500/20">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> Only fields you modify will be updated. Empty fields keep their current values.
                This will create version {(study?.report?.version || 0) + 1} of the report.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!hasEditChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
