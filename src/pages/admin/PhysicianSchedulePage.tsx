import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, endOfWeek
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/userService'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function PhysicianSchedulePage() {
  const { physicianId } = useParams<{ physicianId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const userStore = useUserStore()
  const authStore = useAuthStore()

  const DAY_NAMES = useMemo(() => [
    t('workforce.calendar.sunday'),
    t('workforce.calendar.monday'),
    t('workforce.calendar.tuesday'),
    t('workforce.calendar.wednesday'),
    t('workforce.calendar.thursday'),
    t('workforce.calendar.friday'),
    t('workforce.calendar.saturday'),
  ], [t])

  const isOwnSchedule = authStore.user.id?.toString() === physicianId?.toString()
  const isReadOnly = !authStore.isAdmin()

  const physician = useMemo(() => {
    if (isOwnSchedule) {
      return { id: authStore.user.id, fullName: authStore.fullName?.() || 'User', schedule: null }
    }
    return userStore.users.find(p => p.id === physicianId) || null
  }, [isOwnSchedule, authStore.user.id, authStore, userStore.users, physicianId])

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [schedule, setSchedule] = useState<Record<string, number[]>>({})

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  const getDefaultHoursForDate = useCallback((date: Date): number[] => {
    if (!physician || isOwnSchedule || !(physician as any).schedule) return []
    const p = physician as any
    const dayName = DAY_NAMES[date.getDay()]
    if (!p.schedule.days.includes(dayName)) return []
    const startHour = parseInt(p.schedule.hours.start.split(':')[0])
    const endHour = parseInt(p.schedule.hours.end.split(':')[0])
    return Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  }, [physician, isOwnSchedule, DAY_NAMES])

  const isDefaultWorkingHour = useCallback((date: Date, hour: number): boolean => {
    if (!physician || isOwnSchedule || !(physician as any).schedule) return false
    const p = physician as any
    const dayName = DAY_NAMES[date.getDay()]
    if (!p.schedule.days.includes(dayName)) return false
    const startHour = parseInt(p.schedule.hours.start.split(':')[0])
    const endHour = parseInt(p.schedule.hours.end.split(':')[0])
    return hour >= startHour && hour < endHour
  }, [physician, isOwnSchedule, DAY_NAMES])

  const isScheduled = useCallback((date: Date, hour: number): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const customHours = schedule[dateKey]
    if (customHours !== undefined) return customHours.includes(hour)
    return isDefaultWorkingHour(date, hour)
  }, [schedule, isDefaultWorkingHour])

  const toggleHour = useCallback((date: Date, hour: number) => {
    if (isReadOnly) return
    const dateKey = format(date, 'yyyy-MM-dd')
    const currentHours = schedule[dateKey] ?? getDefaultHoursForDate(date)
    const newHours = currentHours.includes(hour)
      ? currentHours.filter(h => h !== hour)
      : [...currentHours, hour].sort((a, b) => a - b)
    setSchedule(prev => ({ ...prev, [dateKey]: newHours }))
  }, [isReadOnly, schedule, getDefaultHoursForDate])

  const resetDayToDefault = useCallback((date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    setSchedule(prev => {
      const next = { ...prev }
      delete next[dateKey]
      return next
    })
  }, [])

  const loadSchedule = useCallback(async () => {
    try {
      const userId = isOwnSchedule
        ? (authStore.user.id ? parseInt(String(authStore.user.id)) : null)
        : (physicianId ? parseInt(physicianId) : null)
      if (!userId) return

      const from = currentWeekStart
      const to = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

      const slots = isOwnSchedule
        ? await userService.getSchedule(userId, { from, to })
        : await userService.adminGetSchedule(userId, { from, to })

      const scheduleMap: Record<string, number[]> = {}
      for (const slot of slots) {
        const startDate = new Date(slot.start_time)
        const endDate = new Date(slot.end_time)
        const dateKey = format(startDate, 'yyyy-MM-dd')
        const startHour = startDate.getHours()
        const endHour = endDate.getHours()
        if (!scheduleMap[dateKey]) scheduleMap[dateKey] = []
        for (let h = startHour; h < endHour; h++) {
          if (!scheduleMap[dateKey].includes(h)) scheduleMap[dateKey].push(h)
        }
      }
      setSchedule(scheduleMap)
    } catch (err) {
      console.error('Failed to load schedule:', err)
    }
  }, [isOwnSchedule, authStore.user.id, physicianId, currentWeekStart])

  const saveSchedule = async () => {
    try {
      const userId = isOwnSchedule
        ? (authStore.user.id ? parseInt(String(authStore.user.id)) : null)
        : (physicianId ? parseInt(physicianId) : null)
      if (!userId) return

      const slots: Array<{ startTime: string; endTime: string; isAvailable: boolean }> = []
      for (const [dateKey, hours] of Object.entries(schedule)) {
        if (hours.length === 0) continue
        const sortedHours = [...hours].sort((a, b) => a - b)
        let slotStart = sortedHours[0]
        let slotEnd = sortedHours[0] + 1
        for (let i = 1; i < sortedHours.length; i++) {
          if (sortedHours[i] === slotEnd) {
            slotEnd = sortedHours[i] + 1
          } else {
            slots.push({
              startTime: new Date(`${dateKey}T${String(slotStart).padStart(2, '0')}:00:00`).toISOString(),
              endTime: new Date(`${dateKey}T${String(slotEnd).padStart(2, '0')}:00:00`).toISOString(),
              isAvailable: true,
            })
            slotStart = sortedHours[i]
            slotEnd = sortedHours[i] + 1
          }
        }
        slots.push({
          startTime: new Date(`${dateKey}T${String(slotStart).padStart(2, '0')}:00:00`).toISOString(),
          endTime: new Date(`${dateKey}T${String(slotEnd).padStart(2, '0')}:00:00`).toISOString(),
          isAvailable: true,
        })
      }

      if (isOwnSchedule) {
        await userService.bulkUpdateSchedule(userId, slots)
      } else {
        await userService.adminBulkUpdateSchedule(userId, slots)
      }
      alert(t('schedule.saveSuccess', 'Schedule saved successfully'))
      await loadSchedule()
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save schedule'
      alert(`Error: ${msg}`)
    }
  }

  useEffect(() => { loadSchedule() }, [loadSchedule])

  useEffect(() => {
    if (!isOwnSchedule) userStore.fetchUsers()
  }, [])

  if (!physician) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t('userManagement.editPhysician')}</p>
        <Button variant="outline" onClick={() => navigate('/users')} className="mt-4">
          {t('nav.userManagement')}
        </Button>
      </div>
    )
  }

  const weekOffsets = [-1, 0, 1, 2]
  const baseWeek = startOfWeek(new Date(), { weekStartsOn: 1 })

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(isOwnSchedule ? '/profile' : '/users')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{physician.fullName}</h1>
          <p className="text-sm text-muted-foreground">{t('profile.manageSchedule')}</p>
        </div>
        <Button variant="outline" onClick={saveSchedule} disabled={isReadOnly}>
          {t('common.save')}
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="clinical-card mb-6">
        <div className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            {weekOffsets.map(offset => {
              const wk = addWeeks(baseWeek, offset)
              return (
                <button
                  key={offset}
                  onClick={() => setCurrentWeekStart(wk)}
                  className={cn(
                    'px-4 py-2 text-sm rounded-md transition-colors',
                    isSameDay(wk, currentWeekStart)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {format(wk, 'dd.MM')} - {format(addDays(wk, 6), 'dd.MM')}
                </button>
              )
            })}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="clinical-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {weekDays.map(date => (
              <div key={format(date, 'yyyy-MM-dd')} className="border-b border-border last:border-b-0">
                <div className="flex items-center">
                  <div className="w-32 p-3 border-r border-border bg-muted/30">
                    <div className="text-sm font-medium">{format(date, 'dd.MM')}</div>
                    <div className="text-xs text-muted-foreground">{DAY_NAMES[date.getDay()]}</div>
                    {!isOwnSchedule && schedule[format(date, 'yyyy-MM-dd')] !== undefined && !isReadOnly && (
                      <button
                        onClick={() => resetDayToDefault(date)}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 flex p-2 gap-0.5 flex-wrap">
                    {HOURS.map(hour => (
                      <button
                        key={hour}
                        onClick={() => toggleHour(date, hour)}
                        disabled={isReadOnly}
                        title={`${hour}:00 - ${hour + 1}:00`}
                        className={cn(
                          'w-8 h-8 text-xs font-medium rounded transition-colors flex items-center justify-center',
                          isScheduled(date, hour)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                          !isOwnSchedule && !isScheduled(date, hour) && isDefaultWorkingHour(date, hour) && 'ring-1 ring-primary/30',
                          isReadOnly && 'cursor-not-allowed opacity-60'
                        )}
                      >
                        {String(hour).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/50" />
          <span>Not working</span>
        </div>
        {!isOwnSchedule && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/50 ring-1 ring-primary/30" />
            <span>Default schedule (not customized)</span>
          </div>
        )}
      </div>
    </div>
  )
}
