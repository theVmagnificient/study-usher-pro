import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, MoreHorizontal, UserPlus, FileText, Zap } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DeadlineTimer } from '@/components/ui/DeadlineTimer'
import { ElapsedTimer } from '@/components/ui/ElapsedTimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import apiClient from '@/lib/api/client'
import type { TaskWithEmbedded, User, ClientType } from '@/types/api'
import { mapTaskToStudy } from '@/lib/mappers/taskMapper'
import { useDebounce } from '@/hooks/useDebounce'

interface MappedTask {
  raw: TaskWithEmbedded
  study: ReturnType<typeof mapTaskToStudy>
}

export default function TaskListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [rawTasks, setRawTasks] = useState<TaskWithEmbedded[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [distributing, setDistributing] = useState(false)
  const [distributeResult, setDistributeResult] = useState<{ distributed: number; skipped: number; failed: number } | null>(null)

  const debouncedSearch = useDebounce(searchTerm, 300)

  const statusOptions = [
    { value: 'all', label: t('taskList.allStatuses') },
    { value: 'new', label: t('status.new') },
    { value: 'assigned', label: t('status.assigned') },
    { value: 'in_progress', label: t('status.inProgress') },
    { value: 'draft_ready', label: t('status.draftReady') },
    { value: 'translated', label: t('status.translated') },
    { value: 'assigned_for_validation', label: t('status.assignedForValidation') },
    { value: 'under_validation', label: t('status.underValidation') },
    { value: 'returned', label: t('status.returned') },
    { value: 'finalized', label: t('status.finalized') },
    { value: 'delivered', label: t('status.delivered') },
  ]

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { per_page: 100 }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await apiClient.get<{ items: TaskWithEmbedded[]; total: number }>('/api/v1/admin/tasks', { params })
      setRawTasks(response.data.items)
      setTotal(response.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function distributeAll() {
    setDistributing(true)
    setDistributeResult(null)
    try {
      const response = await apiClient.post<{ distributed: number; skipped: number; failed: number }>('/api/v1/admin/tasks/distribute')
      setDistributeResult(response.data)
      await fetchTasks()
      setTimeout(() => setDistributeResult(null), 8000)
    } catch {
      setDistributeResult({ distributed: 0, skipped: 0, failed: 1 })
    } finally {
      setDistributing(false)
    }
  }

  const mappedTasks: MappedTask[] = rawTasks
    .filter(task => task.study && task.client_type)
    .map(task => ({
      raw: task,
      study: mapTaskToStudy({
        task,
        study: task.study!,
        clientType: task.client_type as ClientType,
        client: { id: task.study!.client_id, name: '', created_at: '', updated_at: '' },
        reportingUser: (task.reporting_radiologist as User | null) ?? undefined,
        validatingUser: (task.validating_radiologist as User | null) ?? undefined,
      }),
    }))

  function handleRowClick(task: TaskWithEmbedded, e: React.MouseEvent) {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="menu"]')) return
    navigate(`/task/${task.id}`)
  }

  return (
    <div>
      <PageHeader
        title={t('taskList.title')}
        subtitle={loading ? t('common.loading') : t('taskList.subtitle', { count: total })}
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
        <div>
          {/* Filters */}
          <div className="clinical-card mb-6">
            <div className="p-4 flex flex-wrap md:flex-nowrap gap-4 items-center">
              <div className="w-full md:w-[330px] flex-shrink-0 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('taskList.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('common.status')} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Button size="sm" disabled={distributing} onClick={distributeAll}>
                  <Zap className="w-4 h-4 mr-1.5" />
                  {distributing ? t('taskList.distributing') : t('taskList.distributeAll')}
                </Button>
              </div>
            </div>
            {distributeResult && (
              <div className="px-4 pb-3">
                <div className={[
                  'text-sm px-3 py-2 rounded-md',
                  distributeResult.failed > 0
                    ? 'bg-destructive/10 text-destructive'
                    : distributeResult.distributed > 0
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-muted text-muted-foreground',
                ].join(' ')}>
                  {t('taskList.distributeResult', {
                    distributed: distributeResult.distributed,
                    skipped: distributeResult.skipped,
                    failed: distributeResult.failed,
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="clinical-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('taskList.headers.studyId')}</th>
                    <th>{t('taskList.headers.patient')}</th>
                    <th>{t('taskList.headers.modalityArea')}</th>
                    <th>{t('taskList.headers.status')}</th>
                    <th>{t('taskList.headers.urgency')}</th>
                    <th>{t('taskList.headers.deadline')}</th>
                    <th>{t('taskList.headers.timeInWork')}</th>
                    <th>{t('taskList.headers.reportingPhysician')}</th>
                    <th>{t('taskList.headers.validatingPhysician')}</th>
                    <th>{t('taskList.headers.created')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {mappedTasks.map(({ raw: task, study }) => (
                    <tr key={task.id} onClick={e => handleRowClick(task, e)} className="cursor-pointer">
                      <td className="font-mono text-xs">{study.accessionNumber || 'N/A'}</td>
                      <td>
                        <div className="text-sm">{study.patientId}</div>
                        <div className="text-xs text-muted-foreground">{study.sex}/{study.age}y</div>
                      </td>
                      <td className="text-sm">{study.modality} / {study.bodyArea}</td>
                      <td><StatusBadge status={study.status} /></td>
                      <td><UrgencyBadge urgency={study.urgency} /></td>
                      <td>
                        {study.status !== 'delivered'
                          ? <DeadlineTimer deadline={study.deadline} />
                          : <span className="text-muted-foreground text-sm">—</span>}
                      </td>
                      <td>
                        <ElapsedTimer
                          startTime={study.receivedAt}
                          endTime={study.status === 'delivered' ? study.updatedAt : undefined}
                        />
                      </td>
                      <td className="text-sm">
                        {task.reporting_radiologist
                          ? `${(task.reporting_radiologist as User).first_name} ${(task.reporting_radiologist as User).last_name}`
                          : <span className="text-muted-foreground">{t('common.unassigned')}</span>}
                      </td>
                      <td className="text-sm">
                        {task.validating_radiologist
                          ? `${(task.validating_radiologist as User).first_name} ${(task.validating_radiologist as User).last_name}`
                          : <span className="text-muted-foreground">{t('common.unassigned')}</span>}
                      </td>
                      <td>
                        <div className="text-sm">{format(parseISO(task.created_at), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(parseISO(task.created_at), 'HH:mm')}</div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => navigate(`/task/${task.id}`)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              {t('taskList.viewDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/report/${task.id}`)}>
                              <FileText className="w-4 h-4 mr-2" />
                              {t('taskList.viewReport')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
