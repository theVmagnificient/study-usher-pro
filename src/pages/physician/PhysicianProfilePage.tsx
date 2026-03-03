import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MessageCircle, CalendarClock, Clock } from 'lucide-react'
import { startOfWeek, endOfWeek, addDays, subMonths, format } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/userService'
import type { Physician } from '@/types/study'
import type { UserStats, ScheduleSlot } from '@/types/api'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function currentWeekDays(): Date[] {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function slotsForDay(slots: ScheduleSlot[], date: Date): ScheduleSlot[] {
  const dayStr = format(date, 'yyyy-MM-dd')
  return slots.filter(s => s.start_time.startsWith(dayStr) && s.is_available)
}

export default function PhysicianProfilePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const authStore = useAuthStore()

  const [physician, setPhysician] = useState<Physician | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const weekDays = currentWeekDays()
  const now = new Date()
  const thisMonthName = format(now, 'MMMM')
  const lastMonthName = format(subMonths(now, 1), 'MMMM')

  useEffect(() => {
    const userId = authStore.user.id as number
    if (!userId) return

    const authUser = {
      firstName: authStore.user.firstname || undefined,
      lastName: authStore.user.lastname || undefined,
      email: authStore.user.email || undefined,
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [profileResult, slotResult] = await Promise.all([
          userService.getProfileWithDetails(userId, authUser as any),
          userService.getSchedule(userId, { from: weekDays[0], to: weekDays[6] }),
        ])
        setPhysician(profileResult.profile)
        setStats(profileResult.statistics)
        setScheduleSlots(slotResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t('profile.title')}
        subtitle={loading ? t('common.loading') : t('profile.subtitle')}
        actions={<Button variant="outline">{t('profile.editProfile')}</Button>}
      />

      {loading && (
        <div className="clinical-card p-8 text-center">
          <p className="text-muted-foreground">{t('profile.loadingProfile')}</p>
        </div>
      )}
      {!loading && error && (
        <div className="clinical-card p-8 text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true) }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            {t('profile.retry')}
          </button>
        </div>
      )}
      {!loading && !error && !physician && (
        <div className="clinical-card p-8 text-center">
          <p className="text-muted-foreground">{t('profile.noProfile')}</p>
        </div>
      )}

      {!loading && !error && physician && (
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT column */}
          <div className="col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('profile.contactInformation')}</h3>
              </div>
              <div className="clinical-card-body">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="section-header">{t('profile.fullName')}</label>
                    <p className="text-sm font-medium">{physician.fullName}</p>
                  </div>
                  <div>
                    <label className="section-header">{t('profile.email')}</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm">{physician.email}</p>
                    </div>
                  </div>
                  {physician.telegram && (
                    <div>
                      <label className="section-header">{t('profile.telegram')}</label>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm">{physician.telegram}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('profile.weekSchedule')}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/schedule/${authStore.user.id}`)}
                >
                  <CalendarClock className="w-4 h-4 mr-2" />
                  {t('profile.manageSchedule')}
                </Button>
              </div>
              <div className="clinical-card-body">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, i) => {
                    const slots = slotsForDay(scheduleSlots, day)
                    const isOff = slots.length === 0
                    return (
                      <div
                        key={i}
                        className="text-center p-3 rounded-lg border bg-muted/40 border-border"
                      >
                        <p className="text-xs text-muted-foreground mb-1">{DAY_LABELS[i]}</p>
                        <p className="text-xs font-medium mb-0.5">{format(day, 'd')}</p>
                        {isOff ? (
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{t('profile.off')}</p>
                          </div>
                        ) : (
                          slots.map(s => (
                            <p key={s.id} className="text-xs text-primary">
                              {format(new Date(s.start_time), 'HH:mm')}–{format(new Date(s.end_time), 'HH:mm')}
                            </p>
                          ))
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Supported Areas */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('profile.supportedAreas')}</h3>
              </div>
              <div className="clinical-card-body space-y-4">
                <div>
                  <label className="section-header">{t('profile.modalities')}</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(physician.supportedModalities || []).map(m => (
                      <span key={m} className="px-2 py-0.5 text-xs bg-muted rounded">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="section-header">{t('profile.bodyAreas')}</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(physician.supportedBodyAreas || []).map(b => (
                      <span key={b} className="px-2 py-0.5 text-xs bg-muted rounded">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT column — statistics */}
          <div className="space-y-6">
            {/* Monthly Performance */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('profile.monthlyPerformance')}</h3>
              </div>
              <div className="clinical-card-body">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('profile.thisMonth')}</p>
                    <p className="text-2xl font-bold text-primary">{stats?.tasks_this_month ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{thisMonthName}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('profile.lastMonth')}</p>
                    <p className="text-2xl font-bold text-primary">{stats?.tasks_last_month ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lastMonthName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All-time Total */}
            <div className="clinical-card">
              <div className="clinical-card-body text-center py-4">
                <p className="text-3xl font-bold text-primary">{stats?.total_tasks ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('profile.allTimeTotal')}</p>
              </div>
            </div>

            {/* By Modality */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('profile.byModality')}</h3>
                <span className="text-xs text-muted-foreground">{thisMonthName}</span>
              </div>
              <div className="clinical-card-body space-y-2">
                {stats && Object.keys(stats.monthly_tasks_by_modality).length > 0 ? (
                  Object.entries(stats.monthly_tasks_by_modality).map(([modality, count]) => (
                    <div key={modality} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{modality}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t('profile.noData')}</p>
                )}
              </div>
            </div>

            {/* By Body Area */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('profile.byBodyArea')}</h3>
                <span className="text-xs text-muted-foreground">{thisMonthName}</span>
              </div>
              <div className="clinical-card-body space-y-2">
                {stats && Object.keys(stats.monthly_tasks_by_body_area).length > 0 ? (
                  Object.entries(stats.monthly_tasks_by_body_area).map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{area}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t('profile.noData')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
