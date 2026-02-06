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
            <div
              v-for="item in statusCounts"
              :key="item.status"
              :class="[
                'flex items-center justify-between p-3 bg-muted/50 rounded cursor-pointer transition-colors hover:bg-muted',
                selectedPanel === `status-${item.status}` ? 'ring-2 ring-primary' : ''
              ]"
              @click="togglePanel(`status-${item.status}`)"
            >
              <StatusBadge :status="item.status" />
              <span class="text-lg font-semibold">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks Table -->
      <div v-if="selectedTasks.length > 0" class="clinical-card mt-6">
        <div v-if="selectedPanel" class="clinical-card-header" :class="selectedPanel === 'overdue' ? 'bg-destructive/10' : ''">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <template v-if="selectedPanel.startsWith('status-')">
                <StatusBadge :status="selectedPanel.slice(7)" />
              </template>
              <h2 v-else :class="['text-sm font-semibold', selectedPanel === 'overdue' ? 'text-destructive' : '']">
                {{ t('sla.studiesFor', { category: selectedPanelLabel }) }}
              </h2>
            </div>
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
            <tr v-for="task in selectedTasks" :key="task.id">
              <td class="font-mono text-xs">{{ task.study?.accession_number || `#${task.id}` }}</td>
              <td class="text-sm">{{ getClientLabel(task) }}</td>
              <td class="text-sm text-muted-foreground whitespace-nowrap">{{ formatDate(task.created_at) }}</td>
              <td class="text-sm text-muted-foreground whitespace-nowrap">
                {{ getTaskDeadline(task) ? formatDate(getTaskDeadline(task)!.toISOString()) : '-' }}
              </td>
              <td><StatusBadge :status="mapTaskStatus(task.status)" /></td>
              <td class="text-sm">{{ getAssignedPhysician(task) }}</td>
              <td :class="isOverdue(task) ? 'text-destructive font-medium' : 'text-muted-foreground'">
                {{ getDeadlineInfo(task) }}
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
import { apiClient } from '@/lib/api/client'
import { useAuditStore } from '@/stores/auditStore'
import type { TaskWithEmbedded } from '@/types/api'

const { t, locale } = useI18n()
const dateLocale = computed(() => locale.value === 'ru' ? ru : undefined)
const formatDate = (dateString: string) => format(new Date(dateString), 'd MMM yyyy HH:mm', { locale: dateLocale.value })
const auditStore = useAuditStore()

// Local tasks state
const allTasks = ref<TaskWithEmbedded[]>([])  // unfiltered — for stats & counts
const tasks = ref<TaskWithEmbedded[]>([])      // may be filtered by status — for table
const tasksLoading = ref(false)
const tasksError = ref<string | null>(null)

// Date filter state - default to last 24 hours
const now = new Date()
const dateFrom = ref<Date | null>(subHours(now, 24))
const timeFrom = ref(format(subHours(now, 24), 'HH:mm'))
const dateTo = ref<Date | null>(now)
const timeTo = ref(format(now, 'HH:mm'))

const selectedPanel = ref<string | null>(null)

const loading = computed(() => tasksLoading.value || auditStore.loading)
const error = computed(() => tasksError.value || auditStore.error)

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

function getSelectedBackendStatus(): string | undefined {
  if (!selectedPanel.value?.startsWith('status-')) return undefined
  const uiStatus = selectedPanel.value.slice(7)
  return uiToStatus[uiStatus] || uiStatus
}

async function fetchAllTasks() {
  const params: Record<string, any> = { per_page: 100 }
  const range = getDateRange()
  if (range) {
    params.created_from = range.from.toISOString()
    params.created_to = range.to.toISOString()
  }
  const response = await apiClient.get<{ items: TaskWithEmbedded[], total: number }>('/api/v1/admin/tasks', { params })
  allTasks.value = response.data.items
  // If no status filter active, table shows all tasks
  if (!getSelectedBackendStatus()) {
    tasks.value = response.data.items
  }
}

async function fetchFilteredTasks() {
  const backendStatus = getSelectedBackendStatus()
  if (!backendStatus) {
    tasks.value = allTasks.value
    return
  }
  const params: Record<string, any> = { per_page: 100 }
  const range = getDateRange()
  if (range) {
    params.created_from = range.from.toISOString()
    params.created_to = range.to.toISOString()
  }
  params.status = backendStatus
  const response = await apiClient.get<{ items: TaskWithEmbedded[], total: number }>('/api/v1/admin/tasks', { params })
  tasks.value = response.data.items
}

async function fetchData() {
  tasksLoading.value = true
  tasksError.value = null
  try {
    const range = getDateRange()
    await Promise.all([
      fetchAllTasks(),
      auditStore.fetchSLAStats(range),
    ])
    // If status filter is active, also fetch filtered
    if (getSelectedBackendStatus()) {
      await fetchFilteredTasks()
    }
  } catch (err) {
    tasksError.value = err instanceof Error ? err.message : 'Failed to fetch tasks'
  } finally {
    tasksLoading.value = false
  }
}

// Watch date changes and refetch
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch([dateFrom, timeFrom, dateTo, timeTo], () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    fetchData()
  }, 500)
})

// Helper to map task status to UI status (snake_case → kebab-case)
const statusToUi: Record<string, string> = {
  'new': 'new',
  'assigned': 'assigned',
  'in_progress': 'in-progress',
  'draft_ready': 'draft-ready',
  'translated': 'translated',
  'assigned_for_validation': 'assigned-for-validation',
  'under_validation': 'under-validation',
  'returned_for_revision': 'returned',
  'finalized': 'finalized',
  'delivered': 'delivered',
}

// Reverse map: kebab-case → snake_case for backend
const uiToStatus: Record<string, string> = Object.fromEntries(
  Object.entries(statusToUi).map(([k, v]) => [v, k])
)

function mapTaskStatus(status: string): string {
  return statusToUi[status] || status
}

// Task-level computed
const activeTasks = computed(() =>
  allTasks.value.filter(t => mapTaskStatus(t.status) !== 'delivered')
)

const overdueTasks = computed(() => {
  const currentTime = new Date()
  return allTasks.value
    .filter(task => {
      const tat = task.client_type?.expected_tat_hours
      if (!tat) return false
      const created = new Date(task.created_at)
      const deadline = new Date(created.getTime() + tat * 60 * 60 * 1000)
      return deadline < currentTime && mapTaskStatus(task.status) !== 'delivered'
    })
    .sort((a, b) => {
      const aDeadline = new Date(a.created_at).getTime() + (a.client_type?.expected_tat_hours || 0) * 3600000
      const bDeadline = new Date(b.created_at).getTime() + (b.client_type?.expected_tat_hours || 0) * 3600000
      return aDeadline - bDeadline
    })
})

const criticalTasks = computed(() =>
  activeTasks.value.filter(t => {
    const tat = t.client_type?.expected_tat_hours
    if (!tat) return false
    const deadline = new Date(t.created_at).getTime() + tat * 3600000
    const diff = deadline - new Date().getTime()
    return diff > 0 && diff < 60 * 60 * 1000
  })
)

const warningTasks = computed(() =>
  activeTasks.value.filter(t => {
    const tat = t.client_type?.expected_tat_hours
    if (!tat) return false
    const deadline = new Date(t.created_at).getTime() + tat * 3600000
    const diff = deadline - new Date().getTime()
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

// Task-level stats (clickable)
const studyStats = computed(() => [
  { key: 'active', label: t('sla.metrics.activeStudies'), value: activeTasks.value.length, color: 'text-primary' },
  { key: 'overdue', label: t('sla.metrics.overdue'), value: overdueTasks.value.length, color: 'text-destructive' },
  { key: 'critical', label: t('sla.metrics.critical'), value: criticalTasks.value.length, color: 'text-urgency-urgent' },
  { key: 'warning', label: t('sla.metrics.warning'), value: warningTasks.value.length, color: 'text-urgency-urgent' },
])

const statusCounts = computed(() => {
  const counts = (s: string) => allTasks.value.filter(t => mapTaskStatus(t.status) === s).length
  return [
    { status: "new" as const, count: counts('new') },
    { status: "assigned" as const, count: counts('assigned') },
    { status: "in-progress" as const, count: counts('in-progress') },
    { status: "draft-ready" as const, count: counts('draft-ready') },
    { status: "under-validation" as const, count: counts('under-validation') },
    { status: "returned" as const, count: counts('returned') },
    { status: "finalized" as const, count: counts('finalized') },
    { status: "delivered" as const, count: counts('delivered') },
  ]
})

function togglePanel(key: string) {
  const wasStatus = selectedPanel.value?.startsWith('status-')
  const willBeStatus = key.startsWith('status-')

  selectedPanel.value = selectedPanel.value === key ? null : key

  // Refetch tasks when status filter changes (backend-driven)
  if (wasStatus || willBeStatus) {
    fetchFilteredTasks()
  }
}

const selectedPanelLabel = computed(() => {
  if (!selectedPanel.value) return ''
  const labels: Record<string, string> = {
    active: t('sla.metrics.activeStudies'),
    overdue: t('sla.metrics.overdue'),
    critical: t('sla.metrics.critical'),
    warning: t('sla.metrics.warning'),
  }
  if (labels[selectedPanel.value]) return labels[selectedPanel.value]
  // Status-based panel: "status-in-progress" → label from statusCounts
  if (selectedPanel.value.startsWith('status-')) {
    const status = selectedPanel.value.slice(7)
    const item = statusCounts.value.find(s => s.status === status)
    if (item) return item.status
  }
  return ''
})

const selectedTasks = computed(() => {
  // For status panels, backend already filtered — return all loaded tasks
  if (!selectedPanel.value || selectedPanel.value.startsWith('status-')) return tasks.value
  switch (selectedPanel.value) {
    case 'active': return activeTasks.value
    case 'overdue': return overdueTasks.value
    case 'critical': return criticalTasks.value
    case 'warning': return warningTasks.value
    default: return tasks.value
  }
})

function getTaskDeadline(task: TaskWithEmbedded): Date | null {
  const tat = task.client_type?.expected_tat_hours
  if (!tat) return null
  return new Date(new Date(task.created_at).getTime() + tat * 3600000)
}

function isOverdue(task: TaskWithEmbedded) {
  if (mapTaskStatus(task.status) === 'delivered') return false
  const deadline = getTaskDeadline(task)
  if (!deadline) return false
  return deadline < new Date()
}

function getDeadlineInfo(task: TaskWithEmbedded) {
  if (mapTaskStatus(task.status) === 'delivered') return '—'
  const deadline = getTaskDeadline(task)
  if (!deadline) return '-'
  const currentTime = new Date()
  const diffMs = Math.abs(currentTime.getTime() - deadline.getTime())
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return deadline < currentTime ? `+${timeStr}` : `-${timeStr}`
}

function getAssignedPhysician(task: TaskWithEmbedded): string {
  const r = task.reporting_radiologist
  if (r) return `${r.first_name} ${r.last_name}`
  return '-'
}

function getClientLabel(task: TaskWithEmbedded): string {
  const ct = task.client_type
  if (ct) return `${ct.modality} / ${ct.body_area}`
  return '-'
}

onMounted(fetchData)
</script>
