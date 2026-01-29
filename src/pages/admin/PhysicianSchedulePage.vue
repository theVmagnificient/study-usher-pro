<template>
  <!-- Loading State -->
  <div v-if="userStore.loading" class="flex items-center justify-center p-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>

  <!-- Error State -->
  <div v-else-if="userStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
    {{ userStore.error }}
  </div>

  <!-- Not Found -->
  <div v-else-if="!physician" class="p-8 text-center">
    <p class="text-muted-foreground">{{ t('userManagement.editPhysician') }}</p>
    <Button variant="outline" @click="router.push('/users')" class="mt-4">
      {{ t('nav.userManagement') }}
    </Button>
  </div>
  <div v-else>
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" @click="router.push(isOwnSchedule ? '/profile' : '/users')">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div class="flex-1">
        <h1 class="text-xl font-semibold">{{ physician.fullName }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('profile.manageSchedule') }}</p>
      </div>
      <Button
        variant="outline"
        @click="saveSchedule"
        :disabled="isReadOnly"
      >
        {{ t('common.save') }}
      </Button>
    </div>

    <!-- Week Navigation -->
    <div class="clinical-card mb-6">
      <div class="p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" @click="currentWeekStart = subWeeks(currentWeekStart, 1)">
          <ChevronLeft class="w-5 h-5" />
        </Button>
        
        <div class="flex items-center gap-4">
          <!-- Quick week tabs -->
          <button
            v-for="offset in [-1, 0, 1, 2]"
            :key="offset"
            @click="currentWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), offset)"
            :class="cn(
              'px-4 py-2 text-sm rounded-md transition-colors',
              isSameDay(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), offset), currentWeekStart)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )"
          >
            {{ format(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), offset), "dd.MM") }} - {{ format(addDays(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), offset), 6), "dd.MM") }}
          </button>
        </div>
        
        <Button variant="ghost" size="icon" @click="currentWeekStart = addWeeks(currentWeekStart, 1)">
          <ChevronRight class="w-5 h-5" />
        </Button>
      </div>
    </div>

    <!-- Schedule Grid -->
    <div class="clinical-card overflow-hidden">
      <div class="overflow-x-auto">
        <div class="min-w-[800px]">
          <div v-for="date in weekDays" :key="format(date, 'yyyy-MM-dd')" class="border-b border-border last:border-b-0">
            <div class="flex items-center">
              <!-- Date Label -->
              <div class="w-32 p-3 border-r border-border bg-muted/30">
                <div class="text-sm font-medium">{{ format(date, "dd.MM") }}</div>
                <div class="text-xs text-muted-foreground">{{ DAY_NAMES[date.getDay()] }}</div>
                <button
                  v-if="!isOwnSchedule && schedule[format(date, 'yyyy-MM-dd')] !== undefined && !isReadOnly"
                  @click="resetDayToDefault(date)"
                  class="text-xs text-primary hover:underline mt-1"
                >
                  {{ t('common.cancel') }}
                </button>
              </div>
              
              <!-- Hours Grid -->
              <div class="flex-1 flex p-2 gap-0.5">
                <button
                  v-for="hour in HOURS"
                  :key="hour"
                  @click="!isReadOnly && toggleHour(date, hour)"
                  :disabled="isReadOnly"
                  :class="cn(
                    'w-8 h-8 text-xs font-medium rounded transition-colors flex items-center justify-center',
                    isScheduled(date, hour)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                    !isOwnSchedule && !isScheduled(date, hour) && isDefaultWorkingHour(date, hour) && 'ring-1 ring-primary/30',
                    isReadOnly && 'cursor-not-allowed opacity-60'
                  )"
                  :title="`${hour}:00 - ${hour + 1}:00`"
                >
                  {{ String(hour).padStart(2, "0") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-primary" />
        <span>Scheduled</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-muted/50" />
        <span>Not working</span>
      </div>
      <div v-if="!isOwnSchedule" class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-muted/50 ring-1 ring-primary/30" />
        <span>Default schedule (not customized)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, endOfWeek } from 'date-fns'
import Button from '@/components/ui/button.vue'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/userService'
import { cn } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const authStore = useAuthStore()

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES = computed(() => [
  t('workforce.calendar.sunday'),
  t('workforce.calendar.monday'),
  t('workforce.calendar.tuesday'),
  t('workforce.calendar.wednesday'),
  t('workforce.calendar.thursday'),
  t('workforce.calendar.friday'),
  t('workforce.calendar.saturday')
])

// Check if current user is viewing their own schedule
const isOwnSchedule = computed(() => {
  const physicianId = route.params.physicianId
  return authStore.userId?.toString() === physicianId?.toString()
})

// Check if user can edit schedules (only admins can edit)
const isReadOnly = computed(() => {
  return !authStore.isAdmin
})

const physician = computed(() => {
  if (isOwnSchedule.value) {
    // For own schedule, use basic info from authStore
    return {
      id: authStore.userId,
      fullName: authStore.user?.firstName + ' ' + authStore.user?.lastName || 'User'
    }
  }
  // For admin viewing other user's schedule
  return userStore.users.find(p => p.id === route.params.physicianId)
})

const currentWeekStart = ref(startOfWeek(new Date(), { weekStartsOn: 1 }))
const schedule = ref<Record<string, number[]>>({})

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart.value, i))
})

const isDefaultWorkingHour = (date: Date, hour: number) => {
  // Only for admin viewing other user's schedule (not for own schedule)
  if (!physician.value || isOwnSchedule.value || !physician.value.schedule) return false
  const dayName = DAY_NAMES[date.getDay()]
  const isWorkingDay = physician.value.schedule.days.includes(dayName)
  if (!isWorkingDay) return false

  const startHour = parseInt(physician.value.schedule.hours.start.split(":")[0])
  const endHour = parseInt(physician.value.schedule.hours.end.split(":")[0])
  return hour >= startHour && hour < endHour
}

const isScheduled = (date: Date, hour: number) => {
  const dateKey = format(date, "yyyy-MM-dd")
  const customHours = schedule.value[dateKey]
  
  if (customHours !== undefined) {
    return customHours.includes(hour)
  }
  
  return isDefaultWorkingHour(date, hour)
}

const getDefaultHoursForDate = (date: Date): number[] => {
  // Only for admin viewing other user's schedule (not for own schedule)
  if (!physician.value || isOwnSchedule.value || !physician.value.schedule) return []
  const dayName = DAY_NAMES[date.getDay()]
  if (!physician.value.schedule.days.includes(dayName)) return []

  const startHour = parseInt(physician.value.schedule.hours.start.split(":")[0])
  const endHour = parseInt(physician.value.schedule.hours.end.split(":")[0])
  return Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
}

const toggleHour = (date: Date, hour: number) => {
  const dateKey = format(date, "yyyy-MM-dd")
  const currentHours = schedule.value[dateKey] ?? getDefaultHoursForDate(date)
  
  const newHours = currentHours.includes(hour)
    ? currentHours.filter(h => h !== hour)
    : [...currentHours, hour].sort((a, b) => a - b)
  
  schedule.value = {
    ...schedule.value,
    [dateKey]: newHours
  }
}

const resetDayToDefault = (date: Date) => {
  const dateKey = format(date, "yyyy-MM-dd")
  const newSchedule = { ...schedule.value }
  delete newSchedule[dateKey]
  schedule.value = newSchedule
}

const loadSchedule = async () => {
  try {
    const physicianId = route.params.physicianId as string

    if (isOwnSchedule.value) {
      // Load own schedule using self-service API
      const userId = authStore.userId
      if (!userId) return

      const slots = await userService.getSchedule(userId, {
        from: currentWeekStart.value,
        to: endOfWeek(currentWeekStart.value, { weekStartsOn: 1 })
      })

      // Convert slots to schedule map
      const scheduleMap: Record<string, number[]> = {}
      slots.forEach(slot => {
        const startDate = new Date(slot.start_time)
        const endDate = new Date(slot.end_time)
        const dateKey = format(startDate, 'yyyy-MM-dd')

        const startHour = startDate.getHours()
        const endHour = endDate.getHours()

        if (!scheduleMap[dateKey]) {
          scheduleMap[dateKey] = []
        }

        for (let hour = startHour; hour < endHour; hour++) {
          if (!scheduleMap[dateKey].includes(hour)) {
            scheduleMap[dateKey].push(hour)
          }
        }
      })

      schedule.value = scheduleMap
    } else {
      // Admin loading another user's schedule
      const userId = parseInt(physicianId)
      if (!userId) return

      const slots = await userService.adminGetSchedule(userId, {
        from: currentWeekStart.value,
        to: endOfWeek(currentWeekStart.value, { weekStartsOn: 1 })
      })

      // Convert slots to schedule map
      const scheduleMap: Record<string, number[]> = {}
      slots.forEach(slot => {
        const startDate = new Date(slot.start_time)
        const endDate = new Date(slot.end_time)
        const dateKey = format(startDate, 'yyyy-MM-dd')

        const startHour = startDate.getHours()
        const endHour = endDate.getHours()

        if (!scheduleMap[dateKey]) {
          scheduleMap[dateKey] = []
        }

        for (let hour = startHour; hour < endHour; hour++) {
          if (!scheduleMap[dateKey].includes(hour)) {
            scheduleMap[dateKey].push(hour)
          }
        }
      })

      schedule.value = scheduleMap
    }
  } catch (error) {
    console.error('Failed to load schedule:', error)
  }
}

const saveSchedule = async () => {
  try {
    const physicianId = route.params.physicianId as string
    const userId = isOwnSchedule.value ? authStore.userId : parseInt(physicianId)

    if (!userId) {
      console.error('No user ID available')
      alert('Error: No user ID found')
      return
    }

    console.log('Saving schedule:', {
      isOwnSchedule: isOwnSchedule.value,
      userId,
      isAdmin: authStore.isAdmin
    })

    // Convert schedule map to slot format
    const slots: Array<{ startTime: string; endTime: string; isAvailable: boolean }> = []

    Object.entries(schedule.value).forEach(([dateKey, hours]) => {
      if (hours.length === 0) return

      // Group consecutive hours into slots
      const sortedHours = [...hours].sort((a, b) => a - b)
      let slotStart = sortedHours[0]
      let slotEnd = sortedHours[0] + 1

      for (let i = 1; i < sortedHours.length; i++) {
        const hour = sortedHours[i]
        if (hour === slotEnd) {
          // Continue current slot
          slotEnd = hour + 1
        } else {
          // Save current slot and start new one
          const startTime = new Date(`${dateKey}T${String(slotStart).padStart(2, '0')}:00:00`)
          const endTime = new Date(`${dateKey}T${String(slotEnd).padStart(2, '0')}:00:00`)

          slots.push({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAvailable: true
          })

          slotStart = hour
          slotEnd = hour + 1
        }
      }

      // Save last slot
      const startTime = new Date(`${dateKey}T${String(slotStart).padStart(2, '0')}:00:00`)
      const endTime = new Date(`${dateKey}T${String(slotEnd).padStart(2, '0')}:00:00`)

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isAvailable: true
      })
    })

    console.log('Schedule slots to save:', slots.length)

    // Use appropriate API based on user type
    if (isOwnSchedule.value) {
      await userService.bulkUpdateSchedule(userId, slots)
    } else {
      if (!authStore.isAdmin) {
        throw new Error('Only admins can edit other users\' schedules')
      }
      await userService.adminBulkUpdateSchedule(userId, slots)
    }

    alert(t('schedule.saveSuccess', 'Schedule saved successfully'))

    // Reload schedule to confirm changes
    await loadSchedule()
  } catch (error: any) {
    console.error('Failed to save schedule:', error)
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to save schedule'
    alert(`Error: ${errorMessage}`)
  }
}

// Watch week changes to reload schedule
watch(currentWeekStart, async () => {
  await loadSchedule()
})

onMounted(async () => {
  if (!isOwnSchedule.value) {
    await userStore.fetchUsers()
  }
  await loadSchedule()
})
</script>
