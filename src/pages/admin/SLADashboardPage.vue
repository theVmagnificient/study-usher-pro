<template>
  <div>
    <PageHeader
      :title="t('sla.title')"
      :subtitle="loading ? t('common.loading') : t('sla.subtitle')"
    />

    <!-- Date/Time Filters -->
    <div class="clinical-card mb-6">
      <div class="p-4 flex flex-wrap md:flex-nowrap gap-4 items-center">
        <!-- Date Range Filter - From -->
        <Popover>
          <template #trigger>
            <Button variant="outline" :class="cn(
              'w-[200px] justify-start text-left font-normal',
              !dateFrom && 'text-muted-foreground'
            )">
              <Calendar class="mr-2 h-4 w-4" />
              {{ dateFrom ? `${format(dateFrom, 'MMM d')} ${timeFrom}` : t('sla.fromDateTime') }}
            </Button>
          </template>
          <CalendarComponent
            :selected="dateFrom"
            @select="dateFrom = $event"
          />
          <div class="border-t p-3">
            <Label class="text-xs text-muted-foreground">{{ t('common.time') }}</Label>
            <div class="flex items-center gap-2 mt-1">
              <Clock class="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                :model-value="timeFrom"
                @update:model-value="timeFrom = $event"
                class="w-[120px]"
              />
            </div>
          </div>
        </Popover>

        <!-- Date Range Filter - To -->
        <Popover>
          <template #trigger>
            <Button variant="outline" :class="cn(
              'w-[200px] justify-start text-left font-normal',
              !dateTo && 'text-muted-foreground'
            )">
              <Calendar class="mr-2 h-4 w-4" />
              {{ dateTo ? `${format(dateTo, 'MMM d')} ${timeTo}` : t('sla.toDateTime') }}
            </Button>
          </template>
          <CalendarComponent
            :selected="dateTo"
            @select="dateTo = $event"
          />
          <div class="border-t p-3">
            <Label class="text-xs text-muted-foreground">{{ t('common.time') }}</Label>
            <div class="flex items-center gap-2 mt-1">
              <Clock class="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                :model-value="timeTo"
                @update:model-value="timeTo = $event"
                class="w-[120px]"
              />
            </div>
          </div>
        </Popover>

        <Button v-if="hasCustomDateRange" variant="ghost" size="sm" @click="resetDateFilters">
          {{ t('sla.clearFilters') }}
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else>
      <!-- SLA Stats Metrics -->
      <div v-if="auditStore.slaStats" class="grid grid-cols-5 gap-4 mb-6">
        <div
          v-for="stat in slaMetrics"
          :key="stat.key"
          :class="[
            'clinical-card p-4 transition-colors',
            stat.clickable ? 'cursor-pointer hover:bg-muted/50' : '',
            selectedPanel === stat.key ? 'ring-2 ring-primary' : ''
          ]"
          @click="stat.clickable ? togglePanel(stat.key) : undefined"
        >
          <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
          <p :class="['text-3xl font-semibold mt-1', stat.color]">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Study-level Metrics (clickable) -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in studyStats"
          :key="stat.key"
          :class="[
            'clinical-card p-4 cursor-pointer transition-colors hover:bg-muted/50',
            selectedPanel === stat.key ? 'ring-2 ring-primary' : ''
          ]"
          @click="togglePanel(stat.key)"
        >
          <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
          <p :class="['text-3xl font-semibold mt-1', stat.color]">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Status Distribution -->
      <div class="clinical-card">
        <div class="clinical-card-header">
          <h2 class="text-sm font-semibold">{{ t('sla.statusDistribution') }}</h2>
        </div>
        <div class="clinical-card-body">
          <div class="grid grid-cols-4 gap-4">
            <div v-for="item in statusCounts" :key="item.status" class="flex items-center justify-between p-3 bg-muted/50 rounded">
              <StatusBadge :status="item.status" />
              <span class="text-lg font-semibold">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Studies Table -->
      <div v-if="selectedStudies.length > 0" class="clinical-card mt-6">
        <div v-if="selectedPanel" class="clinical-card-header" :class="selectedPanel === 'overdue' ? 'bg-destructive/10' : ''">
          <div class="flex items-center justify-between w-full">
            <h2 :class="['text-sm font-semibold', selectedPanel === 'overdue' ? 'text-destructive' : '']">
              {{ t('sla.studiesFor', { category: selectedPanelLabel }) }}
            </h2>
            <Button variant="ghost" size="sm" @click="selectedPanel = null">
              <X class="w-4 h-4" />
            </Button>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('sla.headers.studyId') }}</th>
              <th>{{ t('sla.headers.client') }}</th>
              <th>{{ t('sla.headers.receivedAt') }}</th>
              <th>{{ t('sla.headers.deadline') }}</th>
              <th>{{ t('sla.headers.status') }}</th>
              <th>{{ t('sla.headers.assignedTo') }}</th>
              <th>{{ t('sla.headers.overdueBy') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="study in selectedStudies" :key="study.id">
              <td class="font-mono text-xs">{{ study.id }}</td>
              <td class="text-sm">{{ study.clientName }}</td>
              <td class="text-sm text-muted-foreground whitespace-nowrap">{{ formatDate(study.receivedAt) }}</td>
              <td class="text-sm text-muted-foreground whitespace-nowrap">{{ study.deadline ? formatDate(study.deadline) : '-' }}</td>
              <td><StatusBadge :status="study.status" /></td>
              <td class="text-sm">{{ study.assignedPhysician || '-' }}</td>
              <td :class="isOverdue(study) ? 'text-destructive font-medium' : 'text-muted-foreground'">
                {{ getDeadlineInfo(study) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { format, subHours } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, Clock, X } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CalendarComponent from '@/components/ui/calendar.vue'
import Popover from '@/components/ui/popover.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import { cn } from '@/lib/utils'
import { useStudyStore } from '@/stores/studyStore'
import { useAuditStore } from '@/stores/auditStore'
import type { Study } from '@/types/study'

const { t, locale } = useI18n()
const dateLocale = computed(() => locale.value === 'ru' ? ru : undefined)
const formatDate = (dateString: string) => format(new Date(dateString), 'd MMM yyyy HH:mm', { locale: dateLocale.value })
const studyStore = useStudyStore()
const auditStore = useAuditStore()

// Date filter state - default to last 24 hours
const now = new Date()
const dateFrom = ref<Date | null>(subHours(now, 24))
const timeFrom = ref(format(subHours(now, 24), 'HH:mm'))
const dateTo = ref<Date | null>(now)
const timeTo = ref(format(now, 'HH:mm'))

const selectedPanel = ref<string | null>(null)

const loading = computed(() => studyStore.loading || auditStore.loading)
const error = computed(() => studyStore.error || auditStore.error)

const hasCustomDateRange = computed(() => {
  if (!dateFrom.value || !dateTo.value) return false
  const defaultFrom = subHours(new Date(), 24)
  return Math.abs(dateFrom.value.getTime() - defaultFrom.getTime()) > 60000
})

function getDateRange() {
  if (!dateFrom.value || !dateTo.value) return undefined

  const from = new Date(dateFrom.value)
  const [fh, fm] = timeFrom.value.split(':').map(Number)
  from.setHours(fh, fm, 0, 0)

  const to = new Date(dateTo.value)
  const [th, tm] = timeTo.value.split(':').map(Number)
  to.setHours(th, tm, 59, 999)

  return { from, to }
}

function resetDateFilters() {
  const n = new Date()
  dateFrom.value = subHours(n, 24)
  timeFrom.value = format(subHours(n, 24), 'HH:mm')
  dateTo.value = n
  timeTo.value = format(n, 'HH:mm')
}

async function fetchData() {
  const range = getDateRange()
  await Promise.all([
    studyStore.fetchStudies(),
    auditStore.fetchSLAStats(range),
  ])
}

// Watch date changes and refetch
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch([dateFrom, timeFrom, dateTo, timeTo], () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    const range = getDateRange()
    auditStore.fetchSLAStats(range)
  }, 500)
})

// Study-level computed
const activeStudies = computed(() =>
  studyStore.studies.filter(s => s.status !== 'delivered')
)

const overdueStudies = computed(() => {
  const currentTime = new Date()
  return studyStore.studies
    .filter(study => {
      if (!study.deadline) return false
      const deadline = new Date(study.deadline)
      return deadline < currentTime && study.status !== 'delivered'
    })
    .sort((a, b) => {
      const aOverdue = new Date().getTime() - new Date(a.deadline!).getTime()
      const bOverdue = new Date().getTime() - new Date(b.deadline!).getTime()
      return bOverdue - aOverdue
    })
})

const criticalStudies = computed(() =>
  activeStudies.value.filter(s => {
    if (!s.deadline) return false
    const diff = new Date(s.deadline).getTime() - new Date().getTime()
    return diff > 0 && diff < 60 * 60 * 1000
  })
)

const warningStudies = computed(() =>
  activeStudies.value.filter(s => {
    if (!s.deadline) return false
    const diff = new Date(s.deadline).getTime() - new Date().getTime()
    return diff >= 60 * 60 * 1000 && diff < 4 * 60 * 60 * 1000
  })
)

// SLA stats metrics (from API)
const slaMetrics = computed(() => {
  const stats = auditStore.slaStats
  if (!stats) return []
  return [
    { key: 'totalTasks', label: t('sla.metrics.totalTasks'), value: stats.total_tasks, color: 'text-primary', clickable: false },
    { key: 'onTime', label: t('sla.metrics.onTime'), value: stats.completed_on_time, color: 'text-green-600', clickable: false },
    { key: 'late', label: t('sla.metrics.late'), value: stats.completed_late, color: 'text-destructive', clickable: false },
    { key: 'complianceRate', label: t('sla.metrics.complianceRate'), value: `${Math.round(stats.sla_compliance_rate * 100)}%`, color: stats.sla_compliance_rate >= 0.9 ? 'text-green-600' : 'text-destructive', clickable: false },
    { key: 'avgTat', label: t('sla.metrics.avgTat'), value: `${stats.average_tat_hours.toFixed(1)}h`, color: 'text-primary', clickable: false },
  ]
})

// Study-level stats (clickable)
const studyStats = computed(() => [
  { key: 'active', label: t('sla.metrics.activeStudies'), value: activeStudies.value.length, color: 'text-primary' },
  { key: 'overdue', label: t('sla.metrics.overdue'), value: overdueStudies.value.length, color: 'text-destructive' },
  { key: 'critical', label: t('sla.metrics.critical'), value: criticalStudies.value.length, color: 'text-urgency-urgent' },
  { key: 'warning', label: t('sla.metrics.warning'), value: warningStudies.value.length, color: 'text-urgency-urgent' },
])

const statusCounts = computed(() => [
  { status: "new" as const, count: studyStore.studies.filter(s => s.status === 'new').length },
  { status: "assigned" as const, count: studyStore.studies.filter(s => s.status === 'assigned').length },
  { status: "in-progress" as const, count: studyStore.studies.filter(s => s.status === 'in-progress').length },
  { status: "draft-ready" as const, count: studyStore.studies.filter(s => s.status === 'draft-ready').length },
  { status: "under-validation" as const, count: studyStore.studies.filter(s => s.status === 'under-validation').length },
  { status: "returned" as const, count: studyStore.studies.filter(s => s.status === 'returned').length },
  { status: "finalized" as const, count: studyStore.studies.filter(s => s.status === 'finalized').length },
  { status: "delivered" as const, count: studyStore.studies.filter(s => s.status === 'delivered').length },
])

function togglePanel(key: string) {
  selectedPanel.value = selectedPanel.value === key ? null : key
}

const selectedPanelLabel = computed(() => {
  const labels: Record<string, string> = {
    active: t('sla.metrics.activeStudies'),
    overdue: t('sla.metrics.overdue'),
    critical: t('sla.metrics.critical'),
    warning: t('sla.metrics.warning'),
  }
  return selectedPanel.value ? labels[selectedPanel.value] || '' : ''
})

const selectedStudies = computed(() => {
  switch (selectedPanel.value) {
    case 'active': return activeStudies.value
    case 'overdue': return overdueStudies.value
    case 'critical': return criticalStudies.value
    case 'warning': return warningStudies.value
    default: return studyStore.studies
  }
})

function isOverdue(study: Study) {
  if (!study.deadline) return false
  return new Date(study.deadline) < new Date()
}

function getDeadlineInfo(study: Study) {
  if (!study.deadline) return '-'
  const currentTime = new Date()
  const deadline = new Date(study.deadline)
  const diffMs = Math.abs(currentTime.getTime() - deadline.getTime())
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return deadline < currentTime ? `+${timeStr}` : `-${timeStr}`
}

onMounted(fetchData)
</script>
