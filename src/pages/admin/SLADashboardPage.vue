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
      <!-- SLA Stats Metrics (read-only, from API) -->
      <div v-if="auditStore.slaStats" class="grid grid-cols-5 gap-4 mb-6">
        <div
          v-for="stat in slaMetrics"
          :key="stat.key"
          class="clinical-card p-4"
        >
          <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
          <p :class="['text-3xl font-semibold mt-1', stat.color]">{{ stat.value }}</p>
        </div>
      </div>

      <!-- SLA Category Metrics (clickable, independent filter axis) -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in studyStats"
          :key="stat.key"
          :class="[
            'clinical-card p-4 cursor-pointer transition-colors hover:bg-muted/50',
            selectedSlaCategory === stat.key ? 'ring-2 ring-primary' : ''
          ]"
          @click="toggleSlaCategory(stat.key)"
        >
          <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
          <p :class="['text-3xl font-semibold mt-1', stat.color]">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Status Distribution (clickable, independent filter axis) -->
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
                selectedStatus === item.status ? 'ring-2 ring-primary' : ''
              ]"
              @click="toggleStatus(item.status)"
            >
              <StatusBadge :status="item.status" />
              <span class="text-lg font-semibold">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks Table -->
      <div v-if="tableTasks.length > 0 || hasAnyFilter" class="clinical-card mt-6">
        <!-- Table Header with active filters -->
        <div v-if="hasAnyFilter" class="clinical-card-header" :class="selectedSlaCategory === 'overdue' ? 'bg-destructive/10' : ''">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <!-- SLA category label -->
              <span
                v-if="selectedSlaCategory"
                :class="['text-sm font-semibold', selectedSlaCategory === 'overdue' ? 'text-destructive' : '']"
              >
                {{ slaCategoryLabel }}
              </span>
              <!-- Separator when both active -->
              <span v-if="selectedSlaCategory && selectedStatus" class="text-muted-foreground">/</span>
              <!-- Status badge -->
              <StatusBadge v-if="selectedStatus" :status="selectedStatus" />
            </div>
            <div class="flex items-center gap-1">
              <Button v-if="selectedStatus" variant="ghost" size="sm" @click="clearStatus">
                <X class="w-4 h-4" />
              </Button>
              <Button v-if="selectedSlaCategory" variant="ghost" size="sm" @click="clearSlaCategory">
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- No results message -->
        <div v-if="tableTasks.length === 0 && hasAnyFilter" class="p-8 text-center text-muted-foreground">
          {{ t('sla.noResults') }}
        </div>

        <!-- Table -->
        <table v-else class="data-table">
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
            <tr v-for="task in tableTasks" :key="task.id">
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

// ─── Data state ───────────────────────────────────────────────
const allTasks = ref<TaskWithEmbedded[]>([])        // unfiltered — for SLA category counts
const statusBaseTasks = ref<TaskWithEmbedded[]>([])  // SLA-filtered — for status distribution counts
const tableTasks = ref<TaskWithEmbedded[]>([])       // both filters — for table display
const tasksLoading = ref(false)
const tasksError = ref<string | null>(null)

// ─── Date filter state ────────────────────────────────────────
const now = new Date()
const dateFrom = ref<Date | null>(subHours(now, 24))
const timeFrom = ref(format(subHours(now, 24), 'HH:mm'))
const dateTo = ref<Date | null>(now)
const timeTo = ref(format(now, 'HH:mm'))

// ─── Two independent filter axes ──────────────────────────────
const selectedSlaCategory = ref<string | null>(null)  // 'active' | 'overdue' | 'critical' | 'warning' | null
const selectedStatus = ref<string | null>(null)        // UI status like 'in-progress' | null

const loading = computed(() => tasksLoading.value || auditStore.loading)
const error = computed(() => tasksError.value || auditStore.error)
const hasAnyFilter = computed(() => !!selectedSlaCategory.value || !!selectedStatus.value)

const hasCustomDateRange = computed(() => {
  if (!dateFrom.value || !dateTo.value) return false
  const defaultFrom = subHours(new Date(), 24)
  return Math.abs(dateFrom.value.getTime() - defaultFrom.getTime()) > 60000
})

// ─── Date helpers ─────────────────────────────────────────────

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

function buildDateParams(): Record<string, string> {
  const params: Record<string, string> = {}
  const range = getDateRange()
  if (range) {
    params.created_from = range.from.toISOString()
    params.created_to = range.to.toISOString()
  }
  return params
}

// ─── Status mapping ───────────────────────────────────────────

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

const uiToStatus: Record<string, string> = Object.fromEntries(
  Object.entries(statusToUi).map(([k, v]) => [v, k])
)

function mapTaskStatus(status: string): string {
  return statusToUi[status] || status
}

function getBackendStatus(): string | undefined {
  if (!selectedStatus.value) return undefined
  return uiToStatus[selectedStatus.value] || selectedStatus.value
}

// ─── Backend data fetching ────────────────────────────────────

async function fetchTasksFromBackend(filters: Record<string, string> = {}): Promise<TaskWithEmbedded[]> {
  const params: Record<string, any> = { per_page: 100, ...buildDateParams(), ...filters }
  const response = await apiClient.get<{ items: TaskWithEmbedded[], total: number }>('/api/v1/admin/tasks', { params })
  return response.data.items
}

async function fetchAllTasks() {
  allTasks.value = await fetchTasksFromBackend()
}

/**
 * Fetch filtered data based on active SLA category and status selections.
 * Minimizes backend requests by reusing data where possible.
 */
async function fetchFilteredData() {
  const hasSla = !!selectedSlaCategory.value
  const hasStatus = !!selectedStatus.value

  if (!hasSla && !hasStatus) {
    // No filters active: reuse allTasks
    statusBaseTasks.value = allTasks.value
    tableTasks.value = allTasks.value
    return
  }

  if (hasSla && !hasStatus) {
    // Only SLA category: one fetch serves both status counts and table
    const result = await fetchTasksFromBackend({ sla_category: selectedSlaCategory.value! })
    statusBaseTasks.value = result
    tableTasks.value = result
    return
  }

  if (!hasSla && hasStatus) {
    // Only status: status counts use allTasks, table uses status-filtered
    statusBaseTasks.value = allTasks.value
    tableTasks.value = await fetchTasksFromBackend({ status: getBackendStatus()! })
    return
  }

  // Both active: parallel fetch — SLA-only for status counts, SLA+status for table
  const [slaOnly, both] = await Promise.all([
    fetchTasksFromBackend({ sla_category: selectedSlaCategory.value! }),
    fetchTasksFromBackend({ sla_category: selectedSlaCategory.value!, status: getBackendStatus()! }),
  ])
  statusBaseTasks.value = slaOnly
  tableTasks.value = both
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
    await fetchFilteredData()
  } catch (err) {
    tasksError.value = err instanceof Error ? err.message : 'Failed to fetch tasks'
  } finally {
    tasksLoading.value = false
  }
}

// ─── Filter toggle handlers ──────────────────────────────────

async function toggleSlaCategory(key: string) {
  selectedSlaCategory.value = selectedSlaCategory.value === key ? null : key
  await fetchFilteredData()
}

async function toggleStatus(status: string) {
  selectedStatus.value = selectedStatus.value === status ? null : status
  await fetchFilteredData()
}

async function clearSlaCategory() {
  selectedSlaCategory.value = null
  await fetchFilteredData()
}

async function clearStatus() {
  selectedStatus.value = null
  await fetchFilteredData()
}

// ─── Watch date changes and refetch ──────────────────────────

let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch([dateFrom, timeFrom, dateTo, timeTo], () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    fetchData()
  }, 500)
})

// ─── SLA category counts (from allTasks) ─────────────────────

const activeTasks = computed(() =>
  allTasks.value.filter(t => mapTaskStatus(t.status) !== 'delivered')
)

const overdueTasks = computed(() => {
  const currentTime = new Date()
  return allTasks.value.filter(task => {
    const tat = task.client_type?.expected_tat_hours
    if (!tat) return false
    const created = new Date(task.created_at)
    const deadline = new Date(created.getTime() + tat * 60 * 60 * 1000)
    return deadline < currentTime && mapTaskStatus(task.status) !== 'delivered'
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

// ─── SLA stats metrics (from API, read-only) ─────────────────

const slaMetrics = computed(() => {
  const stats = auditStore.slaStats
  if (!stats) return []
  return [
    { key: 'totalTasks', label: t('sla.metrics.totalTasks'), value: stats.total_tasks, color: 'text-primary' },
    { key: 'onTime', label: t('sla.metrics.onTime'), value: stats.completed_on_time, color: 'text-green-600' },
    { key: 'late', label: t('sla.metrics.late'), value: stats.completed_late, color: 'text-destructive' },
    { key: 'complianceRate', label: t('sla.metrics.complianceRate'), value: `${Math.round(stats.sla_compliance_rate * 100)}%`, color: stats.sla_compliance_rate >= 0.9 ? 'text-green-600' : 'text-destructive' },
    { key: 'avgTat', label: t('sla.metrics.avgTat'), value: `${stats.average_tat_hours.toFixed(1)}h`, color: 'text-primary' },
  ]
})

// ─── SLA category stats (clickable cards) ────────────────────

const studyStats = computed(() => [
  { key: 'active', label: t('sla.metrics.activeStudies'), value: activeTasks.value.length, color: 'text-primary' },
  { key: 'overdue', label: t('sla.metrics.overdue'), value: overdueTasks.value.length, color: 'text-destructive' },
  { key: 'critical', label: t('sla.metrics.critical'), value: criticalTasks.value.length, color: 'text-urgency-urgent' },
  { key: 'warning', label: t('sla.metrics.warning'), value: warningTasks.value.length, color: 'text-urgency-urgent' },
])

// ─── Status distribution counts (from statusBaseTasks) ───────

const statusCounts = computed(() => {
  const source = statusBaseTasks.value
  const counts = (s: string) => source.filter(t => mapTaskStatus(t.status) === s).length
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

// ─── Filter labels ────────────────────────────────────────────

const slaCategoryLabels: Record<string, () => string> = {
  active: () => t('sla.metrics.activeStudies'),
  overdue: () => t('sla.metrics.overdue'),
  critical: () => t('sla.metrics.critical'),
  warning: () => t('sla.metrics.warning'),
}

const slaCategoryLabel = computed(() => {
  if (!selectedSlaCategory.value) return ''
  return slaCategoryLabels[selectedSlaCategory.value]?.() ?? ''
})

// ─── Task helpers ─────────────────────────────────────────────

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
