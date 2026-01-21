<template>
  <div class="max-w-4xl">
    <PageHeader
      :title="t('profile.title')"
      :subtitle="userStore.loading ? t('common.loading') : t('profile.subtitle')"
    >
      <template #actions>
        <Button variant="outline">{{ t('profile.editProfile') }}</Button>
      </template>
    </PageHeader>

    <div v-if="userStore.loading" class="clinical-card p-8 text-center">
      <p class="text-muted-foreground">{{ t('profile.loadingProfile') }}</p>
    </div>

    <div v-else-if="userStore.error" class="clinical-card p-8 text-center">
      <p class="text-destructive">{{ userStore.error }}</p>
      <button @click="userStore.refresh()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
        {{ t('profile.retry') }}
      </button>
    </div>

    <div v-else-if="!physician" class="clinical-card p-8 text-center">
      <p class="text-muted-foreground">{{ t('profile.noProfile') }}</p>
    </div>

    <div v-else class="grid grid-cols-3 gap-6">
      <!-- Profile Info -->
      <div class="col-span-2 space-y-6">
        <!-- Basic Info Card -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('profile.contactInformation') }}</h3>
          </div>
          <div class="clinical-card-body">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="section-header">{{ t('profile.fullName') }}</label>
                <p class="text-sm font-medium">{{ physician.fullName }}</p>
              </div>
              <div>
                <label class="section-header">{{ t('profile.email') }}</label>
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4 text-muted-foreground" />
                  <p class="text-sm">{{ physician.email }}</p>
                </div>
              </div>
              <div v-if="physician.telegram">
                <label class="section-header">{{ t('profile.telegram') }}</label>
                <div class="flex items-center gap-2">
                  <MessageCircle class="w-4 h-4 text-muted-foreground" />
                  <p class="text-sm">{{ physician.telegram }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Card -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('profile.weekSchedule') }}</h3>
            <Button
              variant="outline"
              size="sm"
              @click="router.push(`/schedule/${physician.id}`)"
            >
              <CalendarClock class="w-4 h-4 mr-2" />
              {{ t('profile.manageSchedule') }}
            </Button>
          </div>
          <div class="clinical-card-body">
            <div class="grid grid-cols-7 gap-2">
              <div
                v-for="day in currentWeekDays"
                :key="day.shortName"
                :class="[
                  'text-center p-3 rounded-lg border',
                  day.isWorkingDay
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-muted/50 border-border'
                ]"
              >
                <p class="text-xs font-medium text-muted-foreground">{{ day.shortName }}</p>
                <p class="text-lg font-semibold mt-1">{{ day.dayNumber }}</p>
                <div class="flex items-center justify-center gap-1 mt-2">
                  <Clock class="w-3 h-3 text-muted-foreground" />
                  <p :class="['text-xs', day.isWorkingDay ? 'text-foreground' : 'text-muted-foreground']">
                    {{ day.hours }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Specialties Card -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('profile.supportedAreas') }}</h3>
          </div>
          <div class="clinical-card-body space-y-4">
            <div>
              <label class="section-header">{{ t('profile.modalities') }}</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <Badge v-for="m in physician.supportedModalities" :key="m" variant="secondary">{{ m }}</Badge>
              </div>
            </div>
            <div>
              <label class="section-header">{{ t('profile.bodyAreas') }}</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <Badge v-for="area in physician.supportedBodyAreas" :key="area" variant="outline">{{ area }}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="col-span-1 space-y-6">
        <!-- Monthly Stats -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('profile.monthlyPerformance') }}</h3>
          </div>
          <div class="clinical-card-body">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-4 bg-primary/5 rounded-lg">
                <p class="text-xs text-muted-foreground uppercase tracking-wide">{{ t('profile.thisMonth') }}</p>
                <p v-if="statisticsLoading" class="text-sm text-muted-foreground mt-2">{{ t('common.loading') }}</p>
                <div v-else>
                  <p class="text-3xl font-bold text-primary mt-1">{{ currentMonthStats.total }}</p>
                  <p class="text-xs text-muted-foreground mt-1">{{ format(new Date(), "MMMM") }}</p>
                </div>
              </div>
              <div class="text-center p-4 bg-muted/50 rounded-lg">
                <p class="text-xs text-muted-foreground uppercase tracking-wide">{{ t('profile.lastMonth') }}</p>
                <p v-if="statisticsLoading" class="text-sm text-muted-foreground mt-2">{{ t('common.loading') }}</p>
                <div v-else>
                  <p class="text-3xl font-bold text-foreground mt-1">{{ previousMonthStats.total }}</p>
                  <p class="text-xs text-muted-foreground mt-1">{{ format(addDays(new Date(), -30), "MMMM") }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- All-time Total -->
        <div class="clinical-card">
          <div class="clinical-card-body text-center py-4">
            <p v-if="statisticsLoading" class="text-sm text-muted-foreground">{{ t('common.loading') }}</p>
            <div v-else>
              <p class="text-2xl font-bold text-primary">{{ allTimeTotal.toLocaleString() }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ t('profile.allTimeTotal') }}</p>
            </div>
          </div>
        </div>

        <!-- By Modality -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('profile.byModality') }}</h3>
            <span class="text-xs text-muted-foreground">{{ t('profile.thisMonth') }}</span>
          </div>
          <div class="clinical-card-body">
            <p v-if="statisticsLoading" class="text-sm text-muted-foreground text-center">{{ t('common.loading') }}</p>
            <p v-else-if="Object.keys(currentMonthStats.byModality).length === 0" class="text-sm text-muted-foreground text-center">{{ t('profile.noData') }}</p>
            <div v-else class="space-y-3">
              <div
                v-for="[modality, count] in Object.entries(currentMonthStats.byModality)
                  .sort(([, a], [, b]) => (b as number) - (a as number))"
                :key="modality"
                class="flex items-center justify-between"
              >
                <span class="text-sm">{{ modality }}</span>
                <span class="text-sm font-medium">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- By Body Area -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('profile.byBodyArea') }}</h3>
            <span class="text-xs text-muted-foreground">{{ t('profile.thisMonth') }}</span>
          </div>
          <div class="clinical-card-body">
            <p v-if="statisticsLoading" class="text-sm text-muted-foreground text-center">{{ t('common.loading') }}</p>
            <p v-else-if="Object.keys(currentMonthStats.byBodyArea).length === 0" class="text-sm text-muted-foreground text-center">{{ t('profile.noData') }}</p>
            <div v-else class="space-y-3">
              <div
                v-for="[area, count] in Object.entries(currentMonthStats.byBodyArea)
                  .sort(([, a], [, b]) => (b as number) - (a as number))"
                :key="area"
                class="flex items-center justify-between"
              >
                <span class="text-sm">{{ area }}</span>
                <span class="text-sm font-medium">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Clock, Mail, MessageCircle, CalendarClock } from 'lucide-vue-next'
import { startOfWeek, addDays, format, getDay } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader.vue'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/userService'
import type { UserStats } from '@/types/api'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const authStore = useAuthStore()

const statistics = ref<UserStats | null>(null)
const statisticsLoading = ref(false)
const statisticsError = ref<string | null>(null)

onMounted(async () => {
  if (authStore.user?.id) {
    statisticsLoading.value = true
    userStore.loading = true
    statisticsError.value = null
    userStore.error = null

    try {
      // Fetch profile and statistics in one request
      const result = await userService.getProfileWithDetails(authStore.user.id, {
        firstName: authStore.user.firstName,
        lastName: authStore.user.lastName,
        email: authStore.user.email,
      })

      userStore.currentProfile = result.profile
      statistics.value = result.statistics
    } catch (error) {
      console.error('Failed to load profile with details:', error)
      statisticsError.value = 'Failed to load profile'
      userStore.error = error instanceof Error ? error.message : 'Failed to load profile'
    } finally {
      statisticsLoading.value = false
      userStore.loading = false
    }
  }
})

const currentMonthStats = computed(() => {
  if (!statistics.value) {
    return {
      total: 0,
      byModality: {},
      byBodyArea: {},
    }
  }

  return {
    total: statistics.value.tasks_this_month,
    byModality: statistics.value.monthly_tasks_by_modality,
    byBodyArea: statistics.value.monthly_tasks_by_body_area,
  }
})

const previousMonthStats = computed(() => {
  if (!statistics.value) {
    return {
      total: 0,
      byModality: {},
      byBodyArea: {},
    }
  }

  return {
    total: statistics.value.tasks_last_month,
    byModality: {},
    byBodyArea: {},
  }
})

const allTimeTotal = computed(() => {
  return statistics.value?.total_tasks ?? 0
})

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const physician = computed(() => userStore.currentProfile)

const currentWeekDays = computed(() => {
  if (!physician.value) return []

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dayIndex = getDay(date)
    const dayName = dayNames[dayIndex]
    const isWorkingDay = physician.value.schedule.days.includes(dayName)

    return {
      date,
      shortName: shortDayNames[dayIndex],
      dayNumber: format(date, "d"),
      isWorkingDay,
      hours: isWorkingDay ? `${physician.value.schedule.hours.start} - ${physician.value.schedule.hours.end}` : "Off",
    }
  })
})
</script>
