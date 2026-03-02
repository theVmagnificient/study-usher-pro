import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isToday, getDay, startOfWeek, endOfWeek, addMonths, subMonths
} from 'date-fns'
import { ChevronLeft, ChevronRight, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'
import type { Modality, BodyArea, Physician } from '@/types/study'

const CRITICAL_THRESHOLD = 1
const WARNING_THRESHOLD = 2

interface DayCapacity {
  date: Date
  radiologists: Physician[]
  totalHours: number
  modalities: Set<Modality>
  bodyAreas: Set<BodyArea>
  capacityLevel: 'critical' | 'warning' | 'good'
}

export default function WorkforceCapacityPage() {
  const { t } = useTranslation()
  const userStore = useUserStore()

  const DAY_NAMES = [
    t('workforce.calendar.sunday'),
    t('workforce.calendar.monday'),
    t('workforce.calendar.tuesday'),
    t('workforce.calendar.wednesday'),
    t('workforce.calendar.thursday'),
    t('workforce.calendar.friday'),
    t('workforce.calendar.saturday'),
  ]
  const dayNames = [
    t('workforce.calendar.sun'),
    t('workforce.calendar.mon'),
    t('workforce.calendar.tue'),
    t('workforce.calendar.wed'),
    t('workforce.calendar.thu'),
    t('workforce.calendar.fri'),
    t('workforce.calendar.sat'),
  ]

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayCapacity | null>(null)

  useEffect(() => { userStore.fetchUsers() }, [])

  const monthCapacity = useMemo((): DayCapacity[] => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: calStart, end: calEnd })

    return days.map(date => {
      const dayOfWeek = DAY_NAMES[getDay(date)]
      const dateString = format(date, 'yyyy-MM-dd')

      const workingRadiologists = userStore.users.filter(physician => {
        if (physician.customSchedule && physician.customSchedule[dateString]) {
          return physician.customSchedule[dateString].length > 0
        }
        return physician.schedule.days.includes(dayOfWeek)
      })

      let totalHours = 0
      for (const physician of workingRadiologists) {
        if (physician.customSchedule && physician.customSchedule[dateString]) {
          totalHours += physician.customSchedule[dateString].length
        } else {
          const s = parseInt(physician.schedule.hours.start.split(':')[0])
          const e = parseInt(physician.schedule.hours.end.split(':')[0])
          totalHours += e - s
        }
      }

      const modalities = new Set<Modality>()
      const bodyAreas = new Set<BodyArea>()
      for (const physician of workingRadiologists) {
        physician.supportedModalities.forEach(m => modalities.add(m))
        physician.supportedBodyAreas.forEach(b => bodyAreas.add(b))
      }

      let capacityLevel: DayCapacity['capacityLevel'] = 'good'
      if (workingRadiologists.length <= CRITICAL_THRESHOLD) capacityLevel = 'critical'
      else if (workingRadiologists.length <= WARNING_THRESHOLD) capacityLevel = 'warning'

      return { date, radiologists: workingRadiologists, totalHours, modalities, bodyAreas, capacityLevel }
    })
  }, [currentMonth, userStore.users, DAY_NAMES])

  const monthStats = useMemo(() => {
    const inMonth = monthCapacity.filter(d => isSameMonth(d.date, currentMonth))
    return {
      criticalDays: inMonth.filter(d => d.capacityLevel === 'critical').length,
      warningDays: inMonth.filter(d => d.capacityLevel === 'warning').length,
      goodDays: inMonth.filter(d => d.capacityLevel === 'good').length,
      avgRadiologists: inMonth.reduce((s, d) => s + d.radiologists.length, 0) / (inMonth.length || 1),
    }
  }, [monthCapacity, currentMonth])

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <PageHeader
          title={t('workforce.title')}
          subtitle={userStore.loading ? t('common.loading') : t('workforce.subtitle')}
        />

        {userStore.loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : userStore.error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">{userStore.error}</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('workforce.metrics.criticalDays')}</p>
                      <p className="text-2xl font-bold text-destructive">{monthStats.criticalDays}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-destructive/60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('workforce.metrics.warningDays')}</p>
                      <p className="text-2xl font-bold text-yellow-600">{monthStats.warningDays}</p>
                    </div>
                    <Info className="w-8 h-8 text-yellow-500/60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/50 bg-green-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('workforce.metrics.goodCoverage')}</p>
                      <p className="text-2xl font-bold text-green-600">{monthStats.goodDays}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500/60" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('workforce.metrics.avgRadiologists')}</p>
                      <p className="text-2xl font-bold">{monthStats.avgRadiologists.toFixed(1)}</p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                  <CardTitle className="text-base font-medium">
                    {format(currentMonth, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-7 mb-2">
                    {dayNames.map(day => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthCapacity.map((day, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                              'aspect-square p-1 rounded-lg text-left transition-all relative overflow-hidden',
                              !isSameMonth(day.date, currentMonth) && 'opacity-40',
                              selectedDay?.date.getTime() === day.date.getTime() && 'ring-2 ring-primary',
                              isToday(day.date) && 'ring-1 ring-primary/50',
                              day.capacityLevel === 'critical' && isSameMonth(day.date, currentMonth) && 'bg-destructive/20 hover:bg-destructive/30',
                              day.capacityLevel === 'warning' && isSameMonth(day.date, currentMonth) && 'bg-yellow-500/20 hover:bg-yellow-500/30',
                              day.capacityLevel === 'good' && isSameMonth(day.date, currentMonth) && 'bg-green-500/10 hover:bg-green-500/20',
                              !isSameMonth(day.date, currentMonth) && 'bg-muted/30 hover:bg-muted/50'
                            )}
                          >
                            <span className={cn('text-xs font-medium', isToday(day.date) && 'text-primary font-bold')}>
                              {format(day.date, 'd')}
                            </span>
                            {isSameMonth(day.date, currentMonth) && (
                              <div className="absolute bottom-1 left-1 right-1">
                                <div className="flex items-center gap-0.5">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[10px] font-medium">{day.radiologists.length}</span>
                                </div>
                              </div>
                            )}
                            {day.capacityLevel === 'critical' && isSameMonth(day.date, currentMonth) && (
                              <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-destructive" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(day.date, 'EEEE, MMM d')}</p>
                          <p>{t('workforce.radiologists', { count: day.radiologists.length })}</p>
                          <p>{t('workforce.totalHours', { count: day.totalHours })}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-destructive/20" />
                      <span>Critical (≤{CRITICAL_THRESHOLD})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-yellow-500/20" />
                      <span>Warning (≤{WARNING_THRESHOLD})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-green-500/10" />
                      <span>Good (&gt;{WARNING_THRESHOLD})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Day Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    {selectedDay ? format(selectedDay.date, 'EEEE, MMMM d') : t('workforce.selectDay')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto">
                  {selectedDay ? (
                    <div className="space-y-4">
                      <div className={cn(
                        'p-3 rounded-lg',
                        selectedDay.capacityLevel === 'critical' && 'bg-destructive/10 border border-destructive/30',
                        selectedDay.capacityLevel === 'warning' && 'bg-yellow-500/10 border border-yellow-500/30',
                        selectedDay.capacityLevel === 'good' && 'bg-green-500/10 border border-green-500/30'
                      )}>
                        <div className="flex items-center gap-2">
                          {selectedDay.capacityLevel === 'critical' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                          {selectedDay.capacityLevel === 'warning' && <Info className="w-4 h-4 text-yellow-600" />}
                          {selectedDay.capacityLevel === 'good' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          <span className={cn(
                            'text-sm font-medium',
                            selectedDay.capacityLevel === 'critical' && 'text-destructive',
                            selectedDay.capacityLevel === 'warning' && 'text-yellow-600',
                            selectedDay.capacityLevel === 'good' && 'text-green-600'
                          )}>
                            {t(`workforce.status.${selectedDay.capacityLevel}`)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-2xl font-bold">{selectedDay.radiologists.length}</p>
                          <p className="text-xs text-muted-foreground">{t('workforce.dayDetails.radiologists')}</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-2xl font-bold">{selectedDay.totalHours}</p>
                          <p className="text-xs text-muted-foreground">{t('workforce.dayDetails.totalHours')}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                          {t('workforce.dayDetails.workingRadiologists')}
                        </h4>
                        {selectedDay.radiologists.length > 0 ? (
                          <div className="space-y-2">
                            {selectedDay.radiologists.map(physician => (
                              <div key={physician.id} className="p-2 bg-muted/30 rounded text-sm">
                                <p className="font-medium">{physician.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {physician.schedule.hours.start} - {physician.schedule.hours.end}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">{t('workforce.dayDetails.noRadiologists')}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                          {t('workforce.dayDetails.modalitiesCovered')}
                        </h4>
                        {selectedDay.modalities.size > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Array.from(selectedDay.modalities).map(m => (
                              <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">{t('workforce.dayDetails.noCoverage')}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                          {t('workforce.dayDetails.bodyAreasCovered')}
                        </h4>
                        {selectedDay.bodyAreas.size > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Array.from(selectedDay.bodyAreas).map(a => (
                              <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">{t('workforce.dayDetails.noCoverage')}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('workforce.dayDetails.helpText')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
