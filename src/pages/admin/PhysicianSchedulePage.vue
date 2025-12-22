<template>
  <div v-if="!physician" class="p-8 text-center">
    <p class="text-muted-foreground">Physician not found</p>
    <Button variant="outline" @click="router.push('/users')" class="mt-4">
      Back to Users
    </Button>
  </div>
  <div v-else>
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" @click="router.push('/users')">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div class="flex-1">
        <h1 class="text-xl font-semibold">{{ physician.fullName }}</h1>
        <p class="text-sm text-muted-foreground">Schedule Management</p>
      </div>
      <Button variant="outline">
        Save Changes
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
                  v-if="schedule[format(date, 'yyyy-MM-dd')] !== undefined"
                  @click="resetDayToDefault(date)"
                  class="text-xs text-primary hover:underline mt-1"
                >
                  Reset
                </button>
              </div>
              
              <!-- Hours Grid -->
              <div class="flex-1 flex p-2 gap-0.5">
                <button
                  v-for="hour in HOURS"
                  :key="hour"
                  @click="toggleHour(date, hour)"
                  :class="cn(
                    'w-8 h-8 text-xs font-medium rounded transition-colors flex items-center justify-center',
                    isScheduled(date, hour)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                    !isScheduled(date, hour) && isDefaultWorkingHour(date, hour) && 'ring-1 ring-primary/30'
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
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-muted/50 ring-1 ring-primary/30" />
        <span>Default schedule (not customized)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import Button from '@/components/ui/button.vue'
import { mockPhysicians } from '@/data/mockData'
import { cn } from '@/lib/utils'

const route = useRoute()
const router = useRouter()

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const physician = computed(() => mockPhysicians.find(p => p.id === route.params.physicianId))

const currentWeekStart = ref(startOfWeek(new Date(), { weekStartsOn: 1 }))

const schedule = ref<Record<string, number[]>>(() => {
  if (!physician.value) return {}
  
  const defaultSchedule: Record<string, number[]> = {}
  const startHour = parseInt(physician.value.schedule.hours.start.split(":")[0])
  const endHour = parseInt(physician.value.schedule.hours.end.split(":")[0])
  
  if (physician.value.customSchedule) {
    Object.entries(physician.value.customSchedule).forEach(([date, hours]) => {
      defaultSchedule[date] = hours
    })
  }
  
  return defaultSchedule
})

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart.value, i))
})

const isDefaultWorkingHour = (date: Date, hour: number) => {
  if (!physician.value) return false
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
  if (!physician.value) return []
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
</script>
