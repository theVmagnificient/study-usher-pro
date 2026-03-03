import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Clock, FileCheck, Loader2, User } from 'lucide-react'
import { differenceInHours } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DeadlineTimer } from '@/components/ui/DeadlineTimer'
import { LinkedBodyAreasDisplay } from '@/components/ui/LinkedBodyAreasDisplay'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import type { Study } from '@/types/study'

function isUrgentValidation(study: Study): boolean {
  if (study.urgency === 'stat') return true
  if (study.urgency === 'urgent') return true
  const hoursToDeadline = differenceInHours(new Date(study.deadline), new Date())
  return hoursToDeadline < 1
}

export default function ValidationQueuePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const taskStore = useTaskStore()
  const authStore = useAuthStore()
  const { myValidationTasks, loading, error } = taskStore

  const isAdmin = authStore.isAdmin()

  useEffect(() => {
    if (isAdmin) taskStore.fetchAdminValidationTasks()
    else taskStore.fetchMyValidationTasks()
  }, [])

  const VALIDATION_STATUSES = ['assigned-for-validation', 'under-validation', 'finalized', 'delivered']
  const allValidationStudies = myValidationTasks.filter(s => VALIDATION_STATUSES.includes(s.status))

  const urgent = allValidationStudies.filter(isUrgentValidation)
  const retro = allValidationStudies.filter(s => !isUrgentValidation(s))

  const urgentInProgress = urgent.filter(s => s.status === 'under-validation')
  const urgentPending = urgent.filter(s => s.status !== 'under-validation' && !['finalized', 'delivered'].includes(s.status))
  const urgentCompleted = urgent.filter(s => ['finalized', 'delivered'].includes(s.status))

  const retroInProgress = retro.filter(s => s.status === 'under-validation')
  const retroPending = retro.filter(s => s.status !== 'under-validation' && !['finalized', 'delivered'].includes(s.status))
  const retroCompleted = retro.filter(s => ['finalized', 'delivered'].includes(s.status))

  function handleStudyClick(taskId: number) {
    navigate(`/report/${taskId}`)
  }

  function QueueRow({ study }: { study: Study }) {
    return (
      <div
        onClick={() => handleStudyClick(study.taskId)}
        className={cn('queue-item', study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && 'queue-item-urgent')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-medium">{study.accessionNumber}</span>
              <StatusBadge status={study.status} />
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <LinkedBodyAreasDisplay study={study} allStudies={myValidationTasks} />
              <span>• {study.patientId} ({study.sex}/{study.age}y)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {study.assignedPhysician && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              {study.assignedPhysician}
            </div>
          )}
          <UrgencyBadge urgency={study.urgency} />
          {!['finalized', 'delivered'].includes(study.status) && <DeadlineTimer deadline={study.deadline} />}
        </div>
      </div>
    )
  }

  function Section({ title, count, studies, emptyMsg, icon: Icon }: {
    title: string; count: number; studies: Study[]; emptyMsg: string; icon: React.ComponentType<any>
  }) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">({count})</span>
        </div>
        {studies.length > 0
          ? <div className="space-y-2">{studies.map(s => <QueueRow key={s.id} study={s} />)}</div>
          : <p className="text-sm text-muted-foreground italic pl-6">{emptyMsg}</p>}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('validation.title')}
        subtitle={loading ? t('common.loading') : t('validation.subtitle', { count: allValidationStudies.length })}
      />

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {!loading && error && <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{error}</div>}

      {!loading && !error && (
        <Tabs defaultValue="urgent" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="urgent" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t('validation.tabs.urgent')}
              {(urgentPending.length + urgentInProgress.length) > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {urgentPending.length + urgentInProgress.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="retrospective" className="gap-2">
              <Clock className="w-4 h-4" />
              {t('validation.tabs.retrospective')}
              {(retroPending.length + retroInProgress.length) > 0 && (
                <span className="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {retroPending.length + retroInProgress.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urgent">
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('validation.urgentAlert')}
              </p>
            </div>
            <Section title={t('validation.sections.inProgress')} count={urgentInProgress.length} studies={urgentInProgress} emptyMsg={t('validation.empty.urgentInProgress')} icon={Loader2} />
            <Section title={t('validation.sections.toValidate')} count={urgentPending.length} studies={urgentPending} emptyMsg={t('validation.empty.urgentToValidate')} icon={FileCheck} />
            <Section title={t('validation.sections.completed')} count={urgentCompleted.length} studies={urgentCompleted} emptyMsg={t('validation.empty.urgentCompleted')} icon={FileCheck} />
          </TabsContent>

          <TabsContent value="retrospective">
            <Section title={t('validation.sections.inProgress')} count={retroInProgress.length} studies={retroInProgress} emptyMsg={t('validation.empty.retroInProgress')} icon={Loader2} />
            <Section title={t('validation.sections.toValidate')} count={retroPending.length} studies={retroPending} emptyMsg={t('validation.empty.retroToValidate')} icon={FileCheck} />
            <Section title={t('validation.sections.completed')} count={retroCompleted.length} studies={retroCompleted} emptyMsg={t('validation.empty.retroCompleted')} icon={FileCheck} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
