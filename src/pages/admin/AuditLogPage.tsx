import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO, subHours } from 'date-fns'
import { Search, Calendar, Clock, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useAuditStore } from '@/stores/auditStore'
import { useUserStore } from '@/stores/userStore'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

const KNOWN_ACTIONS = [
  'task_created',
  'task_assigned',
  'reassign_reporting_radiologist',
  'reassign_validating_radiologist',
  'task_in_progress',
  'task_report_created',
  'task_report_edited_by_validator',
  'task_report_translated',
  'task_report_assigned_for_validation',
  'task_report_under_validation',
  'task_report_returned_for_revision',
  'task_report_finalized',
  'task_report_delivered',
]

export default function AuditLogPage() {
  const { t } = useTranslation()
  const auditStore = useAuditStore()
  const userStore = useUserStore()
  const { auditLog, loading, error, pagination } = auditStore

  const now = new Date()
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date>(subHours(now, 24))
  const [timeFrom, setTimeFrom] = useState(format(subHours(now, 24), 'HH:mm'))
  const [dateTo, setDateTo] = useState<Date>(now)
  const [timeTo, setTimeTo] = useState(format(now, 'HH:mm'))

  const debouncedSearch = useDebounce(searchTerm, 300)
  const debouncedDateFrom = useDebounce(dateFrom, 400)
  const debouncedDateTo = useDebounce(dateTo, 400)
  const debouncedTimeFrom = useDebounce(timeFrom, 400)
  const debouncedTimeTo = useDebounce(timeTo, 400)

  function getLocalizedAction(action: string): string {
    const direct = t(`auditLog.actions.${action}`)
    if (direct !== `auditLog.actions.${action}`) return direct
    const titleCase = action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    const titled = t(`auditLog.actions.${titleCase}`)
    return titled !== `auditLog.actions.${titleCase}` ? titled : titleCase
  }

  useEffect(() => {
    userStore.fetchUsers()
  }, [])

  useEffect(() => {
    const from = new Date(debouncedDateFrom)
    const [fh, fm] = debouncedTimeFrom.split(':').map(Number)
    from.setHours(fh, fm, 0, 0)

    const to = new Date(debouncedDateTo)
    const [th, tm] = debouncedTimeTo.split(':').map(Number)
    to.setHours(th, tm, 59, 999)

    auditStore.fetchAuditLog({
      accessionNumber: debouncedSearch.trim() || undefined,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      userId: userFilter !== 'all' ? Number(userFilter) : undefined,
      dateFrom: from,
      dateTo: to,
    }, 1)
  }, [debouncedSearch, actionFilter, userFilter, debouncedDateFrom, debouncedDateTo, debouncedTimeFrom, debouncedTimeTo])

  const hasActiveFilters = searchTerm !== '' || actionFilter !== 'all' || userFilter !== 'all'

  function clearAllFilters() {
    const n = new Date()
    setSearchTerm('')
    setActionFilter('all')
    setUserFilter('all')
    setDateFrom(subHours(n, 24))
    setTimeFrom(format(subHours(n, 24), 'HH:mm'))
    setDateTo(n)
    setTimeTo(format(n, 'HH:mm'))
  }

  return (
    <div>
      <PageHeader
        title={t('auditLog.title')}
        subtitle={loading ? t('common.loading') : t('auditLog.subtitle', { count: pagination.total })}
      />

      {/* Filters */}
      <div className="clinical-card mb-6">
        <div className="p-4 flex flex-wrap md:flex-nowrap gap-4 items-center">
          <div className="w-full md:w-[280px] flex-shrink-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('auditLog.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('auditLog.allActions')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('auditLog.allActions')}</SelectItem>
              {KNOWN_ACTIONS.map(a => (
                <SelectItem key={a} value={a}>{getLocalizedAction(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('auditLog.allUsers')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('auditLog.allUsers')}</SelectItem>
              {userStore.users.map(u => (
                <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date from */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}>
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? `${format(dateFrom, 'MMM d')} ${timeFrom}` : t('auditLog.fromDateTime')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <div className="space-y-3">
                <Input
                  type="date"
                  value={format(dateFrom, 'yyyy-MM-dd')}
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

          {/* Date to */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}>
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? `${format(dateTo, 'MMM d')} ${timeTo}` : t('auditLog.toDateTime')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <div className="space-y-3">
                <Input
                  type="date"
                  value={format(dateTo, 'yyyy-MM-dd')}
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

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              {t('auditLog.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
      {!loading && error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">{error}</div>
      )}

      {!loading && !error && (
        <div className="clinical-card overflow-hidden">
          {auditLog.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('auditLog.headers.timestamp')}</TableHead>
                  <TableHead>{t('auditLog.headers.accessionNumber')}</TableHead>
                  <TableHead>{t('auditLog.headers.action')}</TableHead>
                  <TableHead>{t('auditLog.headers.statusChange')}</TableHead>
                  <TableHead>{t('auditLog.headers.user')}</TableHead>
                  <TableHead>{t('auditLog.headers.comment')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {entry.timestamp ? format(parseISO(entry.timestamp), 'd MMM yyyy HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {entry.accessionNumber || entry.studyId}
                    </TableCell>
                    <TableCell className="text-sm">{getLocalizedAction(entry.action)}</TableCell>
                    <TableCell>
                      {entry.previousStatus || entry.newStatus ? (
                        <div className="flex items-center gap-1">
                          {entry.previousStatus && <StatusBadge status={entry.previousStatus} />}
                          {entry.previousStatus && entry.newStatus && <span className="text-muted-foreground">→</span>}
                          {entry.newStatus && <StatusBadge status={entry.newStatus} />}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{entry.user}</TableCell>
                    <TableCell>
                      {entry.comment ? (
                        <div className="flex items-start gap-2 max-w-xs">
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground line-clamp-2">{entry.comment}</span>
                        </div>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">{t('auditLog.noEntries')}</div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={!auditStore.hasPreviousPage()} onClick={() => auditStore.previousPage()}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={!auditStore.hasNextPage()} onClick={() => auditStore.nextPage()}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
