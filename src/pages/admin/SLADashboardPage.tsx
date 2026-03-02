import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { format, subHours } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, Clock, X } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import apiClient from '@/lib/api/client'
import { useAuditStore } from '@/stores/auditStore'
import type { TaskWithEmbedded } from '@/types/api'
import type { StudyStatus } from '@/types/study'

const statusToUi: Record<string, string> = {
  new: 'new',
  assigned: 'assigned',
  in_progress: 'in-progress',
  draft_ready: 'draft-ready',
  translated: 'translated',
  assigned_for_validation: 'assigned-for-validation',
  under_validation: 'under-validation',
  returned_for_revision: 'returned',
  finalized: 'finalized',
  delivered: 'delivered',
}
const uiToStatus: Record<string, string> = Object.fromEntries(
  Object.entries(statusToUi).map(([k, v]) => [v, k])
)
function mapTaskStatus(status: string) { return statusToUi[status] || status }

const STATUS_LIST: StudyStatus[] = [
  'new', 'assigned', 'in-progress', 'draft-ready', 'translated',
  'assigned-for-validation', 'under-validation', 'returned', 'finalized', 'delivered',
]

export default function SLADashboardPage() {
  const { t, i18n } = useTranslation()
  const auditStore = useAuditStore()
  const dateLocale = i18n.language === 'ru' ? ru : undefined
  const fmt = (d: string) => format(new Date(d), 'd MMM yyyy HH:mm', { locale: dateLocale })

  const now = new Date()
  const [dateFrom, setDateFrom] = useState<Date | null>(subHours(now, 24))
  const [timeFrom, setTimeFrom] = useState(format(subHours(now, 24), 'HH:mm'))
  const [dateTo, setDateTo] = useState<Date | null>(now)
  const [timeTo, setTimeTo] = useState(format(now, 'HH:mm'))

  const [allTasks, setAllTasks] = useState<TaskWithEmbedded[]>([])
  const [statusBaseTasks, setStatusBaseTasks] = useState<TaskWithEmbedded[]>([])
  const [tableTasks, setTableTasks] = useState<TaskWithEmbedded[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [selectedSlaCategory, setSelectedSlaCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const loading = tasksLoading || auditStore.loading
  const error = tasksError || auditStore.error
  const hasAnyFilter = !!selectedSlaCategory || !!selectedStatus

  const hasCustomDateRange = useMemo(() => {
    if (!dateFrom || !dateTo) return false
    const defaultFrom = subHours(new Date(), 24)
    return Math.abs(dateFrom.getTime() - defaultFrom.getTime()) > 60000
  }, [dateFrom, dateTo])

  function getDateRange() {
    if (!dateFrom || !dateTo) return undefined
    const from = new Date(dateFrom)
    const [fh, fm] = timeFrom.split(':').map(Number)
    from.setHours(fh, fm, 0, 0)
    const to = new Date(dateTo)
    const [th, tm] = timeTo.split(':').map(Number)
    to.setHours(th, tm, 59, 999)
    return { from, to }
  }

  function buildDateParams(): Record<string, string> {
    const params: Record<string, string> = {}
    const range = getDateRange()
    if (range) {
      params.created_from = range.from.toISOString()
      params.created_to = range.to.toISOString()
    }
    return params
  }

  async function fetchTasksFromBackend(filters: Record<string, string> = {}): Promise<TaskWithEmbedded[]> {
    const params = { per_page: 100, ...buildDateParams(), ...filters }
    const response = await (apiClient as any).get<{ items: TaskWithEmbedded[]; total: number }>(
      '/api/v1/admin/tasks', { params }
    )
    return response.data.items
  }

  const getBackendStatus = useCallback(() => {
    if (!selectedStatus) return undefined
    return uiToStatus[selectedStatus] || selectedStatus
  }, [selectedStatus])

  async function fetchFilteredData(all: TaskWithEmbedded[], slaCat: string | null, status: string | null) {
    const backendStatus = status ? (uiToStatus[status] || status) : undefined
    if (!slaCat && !status) {
      setStatusBaseTasks(all)
      setTableTasks(all)
      return
    }
    if (slaCat && !status) {
      const result = await fetchTasksFromBackend({ sla_category: slaCat })
      setStatusBaseTasks(result)
      setTableTasks(result)
      return
    }
    if (!slaCat && status) {
      setStatusBaseTasks(all)
      setTableTasks(await fetchTasksFromBackend({ status: backendStatus! }))
      return
    }
    const [slaOnly, both] = await Promise.all([
      fetchTasksFromBackend({ sla_category: slaCat! }),
      fetchTasksFromBackend({ sla_category: slaCat!, status: backendStatus! }),
    ])
    setStatusBaseTasks(slaOnly)
    setTableTasks(both)
  }

  const fetchData = useCallback(async () => {
    setTasksLoading(true)
    setTasksError(null)
    try {
      const range = getDateRange()
      const [all] = await Promise.all([
        fetchTasksFromBackend(),
        auditStore.fetchSLAStats(range),
      ])
      setAllTasks(all)
      await fetchFilteredData(all, selectedSlaCategory, selectedStatus)
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setTasksLoading(false)
    }
  }, [selectedSlaCategory, selectedStatus, dateFrom, timeFrom, dateTo, timeTo])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchData, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [dateFrom, timeFrom, dateTo, timeTo])

  useEffect(() => { fetchData() }, [])

  async function toggleSlaCategory(key: string) {
    const next = selectedSlaCategory === key ? null : key
    setSelectedSlaCategory(next)
    await fetchFilteredData(allTasks, next, selectedStatus)
  }

  async function toggleStatus(status: string) {
    const next = selectedStatus === status ? null : status
    setSelectedStatus(next)
    await fetchFilteredData(allTasks, selectedSlaCategory, next)
  }

  async function clearSlaCategory() {
    setSelectedSlaCategory(null)
    await fetchFilteredData(allTasks, null, selectedStatus)
  }

  async function clearStatus() {
    setSelectedStatus(null)
    await fetchFilteredData(allTasks, selectedSlaCategory, null)
  }

  function resetDateFilters() {
    const n = new Date()
    setDateFrom(subHours(n, 24))
    setTimeFrom(format(subHours(n, 24), 'HH:mm'))
    setDateTo(n)
    setTimeTo(format(n, 'HH:mm'))
  }

  // SLA category counts
  const activeTasks = allTasks.filter(t => mapTaskStatus(t.status) !== 'delivered')
  const overdueTasks = allTasks.filter(task => {
    const tat = task.client_type?.expected_tat_hours
    if (!tat) return false
    const deadline = new Date(task.created_at).getTime() + tat * 3600000
    return deadline < Date.now() && mapTaskStatus(task.status) !== 'delivered'
  })
  const criticalTasks = activeTasks.filter(t => {
    const tat = t.client_type?.expected_tat_hours
    if (!tat) return false
    const diff = new Date(t.created_at).getTime() + tat * 3600000 - Date.now()
    return diff > 0 && diff < 3600000
  })
  const warningTasks = activeTasks.filter(t => {
    const tat = t.client_type?.expected_tat_hours
    if (!tat) return false
    const diff = new Date(t.created_at).getTime() + tat * 3600000 - Date.now()
    return diff >= 3600000 && diff < 4 * 3600000
  })

  const studyStats = [
    { key: 'active', label: t('sla.metrics.activeStudies'), value: activeTasks.length, color: 'text-primary' },
    { key: 'overdue', label: t('sla.metrics.overdue'), value: overdueTasks.length, color: 'text-destructive' },
    { key: 'critical', label: t('sla.metrics.critical'), value: criticalTasks.length, color: 'text-urgency-urgent' },
    { key: 'warning', label: t('sla.metrics.warning'), value: warningTasks.length, color: 'text-urgency-urgent' },
  ]

  const slaMetrics = useMemo(() => {
    const stats = auditStore.slaStats
    if (!stats) return []
    return [
      { key: 'totalTasks', label: t('sla.metrics.totalTasks'), value: stats.total_tasks, color: 'text-primary' },
      { key: 'onTime', label: t('sla.metrics.onTime'), value: stats.completed_on_time, color: 'text-green-600' },
      { key: 'late', label: t('sla.metrics.late'), value: stats.completed_late, color: 'text-destructive' },
      { key: 'complianceRate', label: t('sla.metrics.complianceRate'), value: `${Math.round(stats.sla_compliance_rate * 100)}%`, color: stats.sla_compliance_rate >= 0.9 ? 'text-green-600' : 'text-destructive' },
      { key: 'avgTat', label: t('sla.metrics.avgTat'), value: `${stats.average_tat_hours.toFixed(1)}h`, color: 'text-primary' },
    ]
  }, [auditStore.slaStats, t])

  const statusCounts = useMemo(() => STATUS_LIST.map(status => ({
    status,
    count: statusBaseTasks.filter(t => mapTaskStatus(t.status) === status).length,
  })), [statusBaseTasks])

  const slaCategoryLabels: Record<string, string> = {
    active: t('sla.metrics.activeStudies'),
    overdue: t('sla.metrics.overdue'),
    critical: t('sla.metrics.critical'),
    warning: t('sla.metrics.warning'),
  }

  function getTaskDeadline(task: TaskWithEmbedded): Date | null {
    const tat = task.client_type?.expected_tat_hours
    if (!tat) return null
    return new Date(new Date(task.created_at).getTime() + tat * 3600000)
  }
  function isOverdue(task: TaskWithEmbedded) {
    if (mapTaskStatus(task.status) === 'delivered') return false
    const dl = getTaskDeadline(task)
    return !!dl && dl < new Date()
  }
  function getDeadlineInfo(task: TaskWithEmbedded) {
    if (mapTaskStatus(task.status) === 'delivered') return '—'
    const dl = getTaskDeadline(task)
    if (!dl) return '-'
    const diffMs = Math.abs(Date.now() - dl.getTime())
    const hours = Math.floor(diffMs / 3600000)
    const mins = Math.floor((diffMs % 3600000) / 60000)
    const str = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    return dl < new Date() ? `+${str}` : `-${str}`
  }
  function getAssignedPhysician(task: TaskWithEmbedded) {
    const r = task.reporting_radiologist
    return r ? `${r.first_name} ${r.last_name}` : '-'
  }
  function getClientLabel(task: TaskWithEmbedded) {
    const ct = task.client_type
    return ct ? `${ct.modality} / ${ct.body_area}` : '-'
  }

  return (
    <div>
      <PageHeader
        title={t('sla.title')}
        subtitle={loading ? t('common.loading') : t('sla.subtitle')}
      />

      {/* Date Filters */}
      <div className="clinical-card mb-6">
        <div className="p-4 flex flex-wrap md:flex-nowrap gap-4 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}>
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? `${format(dateFrom, 'MMM d')} ${timeFrom}` : t('sla.fromDateTime')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <div className="space-y-3">
                <Input
                  type="date"
                  value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
                  onChange={e => {
                    if (!e.target.value) return
                    const [y, m, d] = e.target.value.split('-').map(Number)
                    setDateFrom(new Date(y, m - 1, d))
                  }}
                />
                <div>
                  <Label className="text-xs text-muted-foreground">{t('common.time')}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className="w-[120px]" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}>
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? `${format(dateTo, 'MMM d')} ${timeTo}` : t('sla.toDateTime')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <div className="space-y-3">
                <Input
                  type="date"
                  value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
                  onChange={e => {
                    if (!e.target.value) return
                    const [y, m, d] = e.target.value.split('-').map(Number)
                    setDateTo(new Date(y, m - 1, d))
                  }}
                />
                <div>
                  <Label className="text-xs text-muted-foreground">{t('common.time')}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} className="w-[120px]" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasCustomDateRange && (
            <Button variant="ghost" size="sm" onClick={resetDateFilters}>
              {t('sla.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{error}</div>
      ) : (
        <div>
          {/* SLA Stats from API */}
          {auditStore.slaStats && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              {slaMetrics.map(stat => (
                <div key={stat.key} className="clinical-card p-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={cn('text-3xl font-semibold mt-1', stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* SLA Category Cards (clickable) */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {studyStats.map(stat => (
              <div
                key={stat.key}
                className={cn(
                  'clinical-card p-4 cursor-pointer transition-colors hover:bg-muted/50',
                  selectedSlaCategory === stat.key && 'ring-2 ring-primary'
                )}
                onClick={() => toggleSlaCategory(stat.key)}
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={cn('text-3xl font-semibold mt-1', stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Status Distribution */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h2 className="text-sm font-semibold">{t('sla.statusDistribution')}</h2>
            </div>
            <div className="clinical-card-body">
              <div className="grid grid-cols-5 gap-4">
                {statusCounts.map(item => (
                  <div
                    key={item.status}
                    className={cn(
                      'flex items-center justify-between p-3 bg-muted/50 rounded cursor-pointer transition-colors hover:bg-muted',
                      selectedStatus === item.status && 'ring-2 ring-primary'
                    )}
                    onClick={() => toggleStatus(item.status)}
                  >
                    <StatusBadge status={item.status} />
                    <span className="text-lg font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          {(tableTasks.length > 0 || hasAnyFilter) && (
            <div className="clinical-card mt-6">
              {hasAnyFilter && (
                <div className={cn('clinical-card-header', selectedSlaCategory === 'overdue' && 'bg-destructive/10')}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {selectedSlaCategory && (
                        <span className={cn('text-sm font-semibold', selectedSlaCategory === 'overdue' && 'text-destructive')}>
                          {slaCategoryLabels[selectedSlaCategory]}
                        </span>
                      )}
                      {selectedSlaCategory && selectedStatus && <span className="text-muted-foreground">/</span>}
                      {selectedStatus && <StatusBadge status={selectedStatus as StudyStatus} />}
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedStatus && <Button variant="ghost" size="sm" onClick={clearStatus}><X className="w-4 h-4" /></Button>}
                      {selectedSlaCategory && <Button variant="ghost" size="sm" onClick={clearSlaCategory}><X className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                </div>
              )}

              {tableTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{t('sla.noResults')}</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('sla.headers.studyId')}</th>
                      <th>{t('sla.headers.client')}</th>
                      <th>{t('sla.headers.receivedAt')}</th>
                      <th>{t('sla.headers.deadline')}</th>
                      <th>{t('sla.headers.status')}</th>
                      <th>{t('sla.headers.assignedTo')}</th>
                      <th>{t('sla.headers.overdueBy')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableTasks.map(task => (
                      <tr key={task.id}>
                        <td className="font-mono text-xs">{task.study?.accession_number || `#${task.id}`}</td>
                        <td className="text-sm">{getClientLabel(task)}</td>
                        <td className="text-sm text-muted-foreground whitespace-nowrap">{fmt(task.created_at)}</td>
                        <td className="text-sm text-muted-foreground whitespace-nowrap">
                          {getTaskDeadline(task) ? fmt(getTaskDeadline(task)!.toISOString()) : '-'}
                        </td>
                        <td><StatusBadge status={mapTaskStatus(task.status) as StudyStatus} /></td>
                        <td className="text-sm">{getAssignedPhysician(task)}</td>
                        <td className={isOverdue(task) ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                          {getDeadlineInfo(task)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
