<template>
  <div class="p-6 space-y-6">
    <PageHeader
      title="Workforce Capacity"
      subtitle="Monitor radiologist availability and identify staffing gaps"
    />

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card class="border-destructive/50 bg-destructive/5">
        <CardContent class="pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Critical Days</p>
              <p class="text-2xl font-bold text-destructive">{{ monthStats.criticalDays }}</p>
            </div>
            <AlertTriangle class="w-8 h-8 text-destructive/60" />
          </div>
        </CardContent>
      </Card>

      <Card class="border-yellow-500/50 bg-yellow-500/5">
        <CardContent class="pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Warning Days</p>
              <p class="text-2xl font-bold text-yellow-600">{{ monthStats.warningDays }}</p>
            </div>
            <Info class="w-8 h-8 text-yellow-500/60" />
          </div>
        </CardContent>
      </Card>

      <Card class="border-green-500/50 bg-green-500/5">
        <CardContent class="pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Good Coverage</p>
              <p class="text-2xl font-bold text-green-600">{{ monthStats.goodDays }}</p>
            </div>
            <CheckCircle class="w-8 h-8 text-green-500/60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wider">Avg. Radiologists/Day</p>
              <p class="text-2xl font-bold">{{ monthStats.avgRadiologists.toFixed(1) }}</p>
            </div>
            <Users class="w-8 h-8 text-muted-foreground/60" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-280px)]">
      <!-- Calendar -->
      <Card class="lg:col-span-2 flex flex-col overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between pb-2 flex-shrink-0">
          <CardTitle class="text-base font-medium">
            {{ format(currentMonth, "MMMM yyyy") }}
          </CardTitle>
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="icon" @click="goToPreviousMonth">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" @click="goToNextMonth">
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="flex-1 overflow-y-auto">
          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-2">
            <div v-for="day in dayNames" :key="day" class="text-center text-xs font-medium text-muted-foreground py-2">
              {{ day }}
            </div>
          </div>

          <!-- Calendar grid -->
          <div class="grid grid-cols-7 gap-1">
            <Tooltip v-for="(day, index) in monthCapacity" :key="index">
              <TooltipTrigger as-child>
                <button
                  @click="selectedDay = day"
                  :class="cn(
                    'aspect-square p-1 rounded-lg text-left transition-all relative overflow-hidden',
                    !isSameMonth(day.date, currentMonth) && 'opacity-40',
                    selectedDay?.date.getTime() === day.date.getTime() && 'ring-2 ring-primary',
                    isToday(day.date) && 'ring-1 ring-primary/50',
                    day.capacityLevel === 'critical' && isSameMonth(day.date, currentMonth) && 'bg-destructive/20 hover:bg-destructive/30',
                    day.capacityLevel === 'warning' && isSameMonth(day.date, currentMonth) && 'bg-yellow-500/20 hover:bg-yellow-500/30',
                    day.capacityLevel === 'good' && isSameMonth(day.date, currentMonth) && 'bg-green-500/10 hover:bg-green-500/20',
                    !isSameMonth(day.date, currentMonth) && 'bg-muted/30 hover:bg-muted/50'
                  )"
                >
                  <span :class="cn(
                    'text-xs font-medium',
                    isToday(day.date) && 'text-primary font-bold'
                  )">
                    {{ format(day.date, "d") }}
                  </span>
                  
                  <div v-if="isSameMonth(day.date, currentMonth)" class="absolute bottom-1 left-1 right-1">
                    <div class="flex items-center gap-0.5">
                      <Users class="w-3 h-3 text-muted-foreground" />
                      <span class="text-[10px] font-medium">{{ day.radiologists.length }}</span>
                    </div>
                  </div>

                  <AlertTriangle v-if="day.capacityLevel === 'critical' && isSameMonth(day.date, currentMonth)" class="absolute top-1 right-1 w-3 h-3 text-destructive" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p class="font-medium">{{ format(day.date, "EEEE, MMM d") }}</p>
                <p>{{ day.radiologists.length }} radiologist{{ day.radiologists.length !== 1 ? 's' : '' }}</p>
                <p>{{ day.totalHours }} total hours</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <!-- Legend -->
          <div class="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded bg-destructive/20" />
              <span>Critical (≤{{ CRITICAL_THRESHOLD }})</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded bg-yellow-500/20" />
              <span>Warning (≤{{ WARNING_THRESHOLD }})</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded bg-green-500/10" />
              <span>Good (>{{ WARNING_THRESHOLD }})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Day Details -->
      <Card class="lg:sticky lg:top-6 lg:self-start flex flex-col overflow-hidden lg:h-[calc(100vh-200px)]">
        <CardHeader class="pb-2 flex-shrink-0">
          <CardTitle class="text-base font-medium">
            {{ selectedDay ? format(selectedDay.date, "EEEE, MMMM d") : "Select a day" }}
          </CardTitle>
        </CardHeader>
        <CardContent class="flex-1 overflow-y-auto">
          <div v-if="selectedDay" class="space-y-4">
            <!-- Capacity indicator -->
            <div :class="cn(
              'p-3 rounded-lg',
              selectedDay.capacityLevel === 'critical' && 'bg-destructive/10 border border-destructive/30',
              selectedDay.capacityLevel === 'warning' && 'bg-yellow-500/10 border border-yellow-500/30',
              selectedDay.capacityLevel === 'good' && 'bg-green-500/10 border border-green-500/30'
            )">
              <div class="flex items-center gap-2">
                <AlertTriangle v-if="selectedDay.capacityLevel === 'critical'" class="w-4 h-4 text-destructive" />
                <Info v-if="selectedDay.capacityLevel === 'warning'" class="w-4 h-4 text-yellow-600" />
                <CheckCircle v-if="selectedDay.capacityLevel === 'good'" class="w-4 h-4 text-green-600" />
                <span :class="cn(
                  'text-sm font-medium',
                  selectedDay.capacityLevel === 'critical' && 'text-destructive',
                  selectedDay.capacityLevel === 'warning' && 'text-yellow-600',
                  selectedDay.capacityLevel === 'good' && 'text-green-600'
                )">
                  <template v-if="selectedDay.capacityLevel === 'critical'">Critical - Staffing needed</template>
                  <template v-else-if="selectedDay.capacityLevel === 'warning'">Warning - Limited coverage</template>
                  <template v-else>Good coverage</template>
                </span>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3">
              <div class="text-center p-2 bg-muted/50 rounded">
                <p class="text-2xl font-bold">{{ selectedDay.radiologists.length }}</p>
                <p class="text-xs text-muted-foreground">Radiologists</p>
              </div>
              <div class="text-center p-2 bg-muted/50 rounded">
                <p class="text-2xl font-bold">{{ selectedDay.totalHours }}</p>
                <p class="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </div>

            <!-- Working Radiologists -->
            <div>
              <h4 class="text-xs font-medium text-muted-foreground uppercase mb-2">
                Working Radiologists
              </h4>
              <div v-if="selectedDay.radiologists.length > 0" class="space-y-2">
                <div v-for="physician in selectedDay.radiologists" :key="physician.id" class="p-2 bg-muted/30 rounded text-sm">
                  <p class="font-medium">{{ physician.fullName }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ physician.schedule.hours.start }} - {{ physician.schedule.hours.end }}
                  </p>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground italic">No radiologists scheduled</p>
            </div>

            <!-- Modalities Coverage -->
            <div>
              <h4 class="text-xs font-medium text-muted-foreground uppercase mb-2">
                Modalities Covered
              </h4>
              <div v-if="selectedDay.modalities.size > 0" class="flex flex-wrap gap-1">
                <Badge v-for="modality in Array.from(selectedDay.modalities)" :key="modality" variant="secondary" class="text-xs">
                  {{ modality }}
                </Badge>
              </div>
              <p v-else class="text-sm text-muted-foreground italic">No coverage</p>
            </div>

            <!-- Body Areas Coverage -->
            <div>
              <h4 class="text-xs font-medium text-muted-foreground uppercase mb-2">
                Body Areas Covered
              </h4>
              <div v-if="selectedDay.bodyAreas.size > 0" class="flex flex-wrap gap-1">
                <Badge v-for="area in Array.from(selectedDay.bodyAreas)" :key="area" variant="outline" class="text-xs">
                  {{ area }}
                </Badge>
              </div>
              <p v-else class="text-sm text-muted-foreground italic">No coverage</p>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">
            Click on a day in the calendar to see detailed staffing information.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths
} from 'date-fns'
import PageHeader from '@/components/layout/PageHeader.vue'
import { mockPhysicians } from '@/data/mockData'
import Badge from '@/components/ui/badge.vue'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import Button from '@/components/ui/button.vue'
import {
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Modality, BodyArea, Physician } from '@/types/study'
import Tooltip from '@/components/ui/tooltip.vue'
import TooltipContent from '@/components/ui/TooltipContent.vue'
import TooltipTrigger from '@/components/ui/TooltipTrigger.vue'

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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

const currentMonth = ref(new Date())
const selectedDay = ref<DayCapacity | null>(null)

const monthCapacity = computed(() => {
  const monthStart = startOfMonth(currentMonth.value)
  const monthEnd = endOfMonth(currentMonth.value)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  return days.map((date): DayCapacity => {
    const dayOfWeek = fullDayNames[getDay(date)]
    const dateString = format(date, "yyyy-MM-dd")
    
    const workingRadiologists = mockPhysicians.filter(physician => {
      if (physician.customSchedule && physician.customSchedule[dateString]) {
        return physician.customSchedule[dateString].length > 0
      }
      return physician.schedule.days.includes(dayOfWeek)
    })

    let totalHours = 0
    workingRadiologists.forEach(physician => {
      if (physician.customSchedule && physician.customSchedule[dateString]) {
        totalHours += physician.customSchedule[dateString].length
      } else {
        const startHour = parseInt(physician.schedule.hours.start.split(":")[0])
        const endHour = parseInt(physician.schedule.hours.end.split(":")[0])
        totalHours += endHour - startHour
      }
    })

    const modalities = new Set<Modality>()
    const bodyAreas = new Set<BodyArea>()
    workingRadiologists.forEach(physician => {
      physician.supportedModalities.forEach(m => modalities.add(m))
      physician.supportedBodyAreas.forEach(b => bodyAreas.add(b))
    })

    let capacityLevel: 'critical' | 'warning' | 'good' = 'good'
    if (workingRadiologists.length <= CRITICAL_THRESHOLD) {
      capacityLevel = 'critical'
    } else if (workingRadiologists.length <= WARNING_THRESHOLD) {
      capacityLevel = 'warning'
    }

    return {
      date,
      radiologists: workingRadiologists,
      totalHours,
      modalities,
      bodyAreas,
      capacityLevel,
    }
  })
})

const monthStats = computed(() => {
  const inMonth = monthCapacity.value.filter(d => isSameMonth(d.date, currentMonth.value))
  const criticalDays = inMonth.filter(d => d.capacityLevel === 'critical').length
  const warningDays = inMonth.filter(d => d.capacityLevel === 'warning').length
  const goodDays = inMonth.filter(d => d.capacityLevel === 'good').length
  const avgRadiologists = inMonth.reduce((sum, d) => sum + d.radiologists.length, 0) / inMonth.length
  return { criticalDays, warningDays, goodDays, avgRadiologists }
})

const goToPreviousMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1)
}
const goToNextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
}
</script>
