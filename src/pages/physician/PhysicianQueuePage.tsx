import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, AlertCircle, CheckCircle, Clock, MessageCircle } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DeadlineTimer } from '@/components/ui/DeadlineTimer'
import { LinkedBodyAreasDisplay } from '@/components/ui/LinkedBodyAreasDisplay'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useTaskStore } from '@/stores/taskStore'
import { cn } from '@/lib/utils'
import type { Study } from '@/types/study'

const MAX_ACTIVE = 2

export default function PhysicianQueuePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const taskStore = useTaskStore()
  const { myReportingTasks, loading, error } = taskStore

  useEffect(() => { taskStore.fetchMyReportingTasks() }, [])

  const pendingStudies = myReportingTasks
    .filter(t => ['new', 'assigned', 'in-progress', 'draft-ready', 'returned'].includes(t.status))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  const completedStudies = myReportingTasks
    .filter(s => ['assigned-for-validation', 'under-validation', 'finalized', 'delivered'].includes(s.status))
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())

  const commentedStudies = myReportingTasks
    .filter(s => {
      if (s.status === 'returned') return true
      if (['finalized', 'delivered'].includes(s.status)) {
        return !!(s.validatorCommentsCount && s.validatorCommentsCount > 0)
      }
      return false
    })
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())

  const activeCount = pendingStudies.filter(s => s.status === 'in-progress').length

  function handleStudyClick(taskId: number) {
    navigate(`/report/${taskId}`)
  }

  function QueueItem({ study, urgent }: { study: Study; urgent?: boolean }) {
    return (
      <div
        onClick={() => handleStudyClick(study.id as any)}
        className={cn('queue-item', urgent && 'queue-item-urgent')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-medium">{study.accessionNumber}</span>
              <StatusBadge status={study.status} />
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <LinkedBodyAreasDisplay study={study} allStudies={myReportingTasks} />
              <span>• {study.patientId} ({study.sex}/{study.age}y)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <UrgencyBadge urgency={study.urgency} />
          {!['finalized', 'delivered'].includes(study.status) && <DeadlineTimer deadline={study.deadline} />}
          {study.hasPriors && (
            <span className="status-badge status-assigned">
              {t('queue.priors', { count: study.priorCount })}
            </span>
          )}
          {study.validatorComments && study.validatorComments.length > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <MessageCircle className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    )
  }

  function EmptyState({ icon: Icon, title, desc }: { icon: React.ComponentType<any>; title: string; desc: string }) {
    return (
      <div className="clinical-card p-12 text-center">
        <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('queue.title')}
        subtitle={loading ? t('common.loading') : t('queue.subtitle', { count: pendingStudies.length })}
      />

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{error}</div>
      )}

      {!loading && !error && (
        <>
          {activeCount >= MAX_ACTIVE && (
            <div className="clinical-card p-4 mb-6 border-l-4 border-l-[hsl(var(--urgency-urgent))] bg-[hsl(var(--urgency-urgent)/0.15)]">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[hsl(var(--urgency-urgent))]" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('queue.maxWorkload')}</p>
                  <p className="text-xs text-muted-foreground">{t('queue.completeFirst')}</p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                {t('queue.tabs.toReport')}
                {pendingStudies.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {pendingStudies.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="commented" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {t('queue.tabs.commented')}
                {commentedStudies.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {commentedStudies.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('queue.tabs.completed')}
                {completedStudies.length > 0 && (
                  <span className="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {completedStudies.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="space-y-3">
                {pendingStudies.map(study => (
                  <QueueItem
                    key={study.id}
                    study={study}
                    urgent={study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status)}
                  />
                ))}
                {pendingStudies.length === 0 && (
                  <EmptyState icon={FileText} title={t('queue.empty.noTasks')} desc={t('queue.empty.noTasksDesc')} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="commented">
              <div className="space-y-3">
                {commentedStudies.map(study => (
                  <div key={study.id} onClick={() => handleStudyClick(study.id as any)} className="queue-item">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-medium">{study.accessionNumber}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-status-finalized/20 text-status-finalized">{study.status}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <LinkedBodyAreasDisplay study={study} allStudies={myReportingTasks} />
                          <span>• {study.patientId}</span>
                        </div>
                        {study.validatorComments && study.validatorComments.length > 0 && (
                          <div className="mt-2 p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded border border-amber-500/30">
                            <p className="text-sm text-foreground line-clamp-2">{study.validatorComments[0].text}</p>
                            <p className="text-xs text-muted-foreground mt-1">— {study.validatorComments[0].validatorName}</p>
                            {study.validatorComments.length > 1 && (
                              <p className="text-xs text-amber-600 mt-1">
                                +{t('queue.moreComments', { count: study.validatorComments.length - 1 })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {!['finalized', 'delivered'].includes(study.status) && <DeadlineTimer deadline={study.deadline} />}
                    </div>
                  </div>
                ))}
                {commentedStudies.length === 0 && (
                  <EmptyState icon={MessageCircle} title={t('queue.empty.noCommented')} desc={t('queue.empty.noCommentedDesc')} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="space-y-3">
                {completedStudies.map(study => (
                  <QueueItem
                    key={study.id}
                    study={study}
                    urgent={study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status)}
                  />
                ))}
                {completedStudies.length === 0 && (
                  <EmptyState icon={CheckCircle} title={t('queue.empty.noCompleted')} desc={t('queue.empty.noCompletedDesc')} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
