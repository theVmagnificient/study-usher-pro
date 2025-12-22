<template>
  <div class="max-w-4xl">
    <PageHeader
      title="My Profile"
      subtitle="View your profile and statistics"
    >
      <template #actions>
        <Button variant="outline">Edit Profile</Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-3 gap-6">
      <!-- Profile Info -->
      <div class="col-span-2 space-y-6">
        <!-- Basic Info Card -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">Contact Information</h3>
          </div>
          <div class="clinical-card-body">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="section-header">Full Name</label>
                <p class="text-sm font-medium">{{ physician.fullName }}</p>
              </div>
              <div>
                <label class="section-header">Phone</label>
                <div class="flex items-center gap-2">
                  <Phone class="w-4 h-4 text-muted-foreground" />
                  <p class="text-sm">{{ physician.phone }}</p>
                </div>
              </div>
              <div v-if="physician.telegram">
                <label class="section-header">Telegram</label>
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
            <h3 class="text-sm font-semibold">This Week's Schedule</h3>
            <Button
              variant="outline"
              size="sm"
              @click="router.push(`/schedule/${physician.id}`)"
            >
              <CalendarClock class="w-4 h-4 mr-2" />
              Manage Schedule
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
            <h3 class="text-sm font-semibold">Supported Areas</h3>
          </div>
          <div class="clinical-card-body space-y-4">
            <div>
              <label class="section-header">Modalities</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <Badge v-for="m in physician.supportedModalities" :key="m" variant="secondary">{{ m }}</Badge>
              </div>
            </div>
            <div>
              <label class="section-header">Body Areas</label>
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
            <h3 class="text-sm font-semibold">Monthly Performance</h3>
          </div>
          <div class="clinical-card-body">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-4 bg-primary/5 rounded-lg">
                <p class="text-xs text-muted-foreground uppercase tracking-wide">This Month</p>
                <p class="text-3xl font-bold text-primary mt-1">{{ currentMonthStats.total }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ format(new Date(), "MMMM") }}</p>
              </div>
              <div class="text-center p-4 bg-muted/50 rounded-lg">
                <p class="text-xs text-muted-foreground uppercase tracking-wide">Last Month</p>
                <p class="text-3xl font-bold text-foreground mt-1">{{ previousMonthStats.total }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ format(addDays(new Date(), -30), "MMMM") }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- All-time Total -->
        <div class="clinical-card">
          <div class="clinical-card-body text-center py-4">
            <p class="text-2xl font-bold text-primary">{{ physician.statistics.total.toLocaleString() }}</p>
            <p class="text-xs text-muted-foreground mt-1">All-Time Total</p>
          </div>
        </div>

        <!-- By Modality -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">By Modality</h3>
            <span class="text-xs text-muted-foreground">This month</span>
          </div>
          <div class="clinical-card-body">
            <div class="space-y-3">
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
            <h3 class="text-sm font-semibold">By Body Area</h3>
            <span class="text-xs text-muted-foreground">This month</span>
          </div>
          <div class="clinical-card-body">
            <div class="space-y-3">
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Phone, MessageCircle, CalendarClock } from 'lucide-vue-next'
import { startOfWeek, addDays, format, getDay } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader.vue'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import { mockPhysicians } from '@/data/mockData'

const router = useRouter()

const currentMonthStats = {
  total: 156,
  byModality: { CT: 68, MRI: 52, "X-Ray": 36 },
  byBodyArea: { Spine: 58, Head: 42, Chest: 34, Neck: 22 },
}

const previousMonthStats = {
  total: 143,
  byModality: { CT: 61, MRI: 48, "X-Ray": 34 },
  byBodyArea: { Spine: 52, Head: 38, Chest: 31, Neck: 22 },
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const physician = mockPhysicians[0]

const currentWeekDays = computed(() => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dayIndex = getDay(date)
    const dayName = dayNames[dayIndex]
    const isWorkingDay = physician.schedule.days.includes(dayName)
    
    return {
      date,
      shortName: shortDayNames[dayIndex],
      dayNumber: format(date, "d"),
      isWorkingDay,
      hours: isWorkingDay ? `${physician.schedule.hours.start} - ${physician.schedule.hours.end}` : "Off",
    }
  })
})
</script>
