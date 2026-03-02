import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MessageCircle, CalendarClock } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function PhysicianProfilePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const userStore = useUserStore()
  const authStore = useAuthStore()
  const { currentProfile: physician, loading, error } = userStore

  useEffect(() => {
    const userId = authStore.user.id as number
    if (userId) {
      userStore.fetchProfile(userId, {
        firstName: authStore.user.firstname ?? '',
        lastName: authStore.user.lastname ?? '',
        email: authStore.user.email ?? '',
      })
    }
  }, [])

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t('profile.title')}
        subtitle={loading ? t('common.loading') : t('profile.subtitle')}
        actions={<Button variant="outline">{t('profile.editProfile')}</Button>}
      />

      {loading && <div className="clinical-card p-8 text-center"><p className="text-muted-foreground">{t('profile.loadingProfile')}</p></div>}
      {!loading && error && (
        <div className="clinical-card p-8 text-center">
          <p className="text-destructive">{error}</p>
          <button onClick={() => userStore.refresh()} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">{t('profile.retry')}</button>
        </div>
      )}
      {!loading && !error && !physician && <div className="clinical-card p-8 text-center"><p className="text-muted-foreground">{t('profile.noProfile')}</p></div>}

      {!loading && !error && physician && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Basic Info */}
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
                <Button variant="outline" size="sm" onClick={() => navigate(`/schedule/${authStore.user.id}`)}>
                  <CalendarClock className="w-4 h-4 mr-2" />
                  {t('profile.manageSchedule')}
                </Button>
              </div>
              <div className="clinical-card-body">
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map(day => (
                    <div key={day} className="text-center p-3 rounded-lg border bg-muted/40 border-border">
                      <p className="text-xs text-muted-foreground mb-1">{day}</p>
                      <p className="text-xs text-muted-foreground">—</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{t('profile.capabilities')}</h3>
              </div>
              <div className="clinical-card-body space-y-4">
                <div>
                  <label className="section-header">{t('profile.modalities')}</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(physician.modalities || []).map(m => (
                      <span key={m} className="px-2 py-0.5 text-xs bg-muted rounded">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="section-header">{t('profile.bodyAreas')}</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(physician.bodyAreas || []).map(b => (
                      <span key={b} className="px-2 py-0.5 text-xs bg-muted rounded">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
