<template>
  <div>
    <PageHeader
      :title="t('auditLog.title')"
      :subtitle="auditStore.loading ? t('common.loading') : t('auditLog.subtitle', { count: auditStore.pagination.total })"
    />

    <!-- Filters -->
    <div class="clinical-card mb-6">
      <div class="p-4 flex flex-wrap md:flex-nowrap gap-4 items-center">
        <!-- Search by accession number -->
        <div class="w-full md:w-[280px] flex-shrink-0">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              :placeholder="t('auditLog.searchPlaceholder')"
              :model-value="searchTerm"
              @update:model-value="searchTerm = $event"
              class="pl-9"
            />
          </div>
        </div>

        <!-- Action filter -->
        <Select :model-value="actionFilter" @update:model-value="onActionFilterChange($event)">
          <SelectTrigger class="w-[200px]">
            <SelectValue :placeholder="t('auditLog.allActions')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('auditLog.allActions') }}</SelectItem>
            <SelectItem v-for="action in knownActions" :key="action" :value="action">
              {{ getLocalizedAction(action) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- User filter -->
        <Select :model-value="userFilter" @update:model-value="onUserFilterChange($event)">
          <SelectTrigger class="w-[200px]">
            <SelectValue :placeholder="t('auditLog.allUsers')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('auditLog.allUsers') }}</SelectItem>
            <SelectItem v-for="user in usersList" :key="String(user.id)" :value="String(user.id)">
              {{ user.first_name }} {{ user.last_name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Date Range Filter - From -->
        <Popover>
          <template #trigger>
            <Button variant="outline" :class="cn(
              'w-[200px] justify-start text-left font-normal',
              !dateFrom && 'text-muted-foreground'
            )">
              <Calendar class="mr-2 h-4 w-4" />
              {{ dateFrom ? `${format(dateFrom, 'MMM d')} ${timeFrom}` : t('auditLog.fromDateTime') }}
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
              {{ dateTo ? `${format(dateTo, 'MMM d')} ${timeTo}` : t('auditLog.toDateTime') }}
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

        <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearAllFilters">
          {{ t('auditLog.clearFilters') }}
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="auditStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="auditStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ auditStore.error }}
    </div>

    <!-- Content -->
    <div v-else class="clinical-card overflow-hidden">
      <table v-if="auditStore.auditLog.length > 0" class="data-table">
        <thead>
          <tr>
            <th>{{ t('auditLog.headers.timestamp') }}</th>
            <th>{{ t('auditLog.headers.accessionNumber') }}</th>
            <th>{{ t('auditLog.headers.action') }}</th>
            <th>{{ t('auditLog.headers.statusChange') }}</th>
            <th>{{ t('auditLog.headers.user') }}</th>
            <th>{{ t('auditLog.headers.comment') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in auditStore.auditLog" :key="entry.id">
            <td class="text-sm text-muted-foreground whitespace-nowrap">
              {{ formatDate(entry.timestamp) }}
            </td>
            <td class="font-mono text-xs font-medium">{{ entry.accessionNumber || entry.studyId }}</td>
            <td class="text-sm">{{ getLocalizedAction(entry.action) }}</td>
            <td>
              <div v-if="entry.previousStatus && entry.newStatus" class="flex items-center gap-2">
                <StatusBadge :status="entry.previousStatus" />
                <span class="text-muted-foreground">→</span>
                <StatusBadge :status="entry.newStatus" />
              </div>
            </td>
            <td class="text-sm">{{ entry.user }}</td>
            <td>
              <div v-if="entry.comment" class="flex items-start gap-2 max-w-xs">
                <MessageSquare class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span class="text-sm text-muted-foreground line-clamp-2">{{ entry.comment }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="p-8 text-center text-muted-foreground">
        {{ t('auditLog.noEntries') }}
      </div>

      <!-- Pagination -->
      <div v-if="auditStore.pagination.totalPages > 1" class="flex items-center justify-between p-4 border-t">
        <span class="text-sm text-muted-foreground">
          {{ auditStore.pagination.page }} / {{ auditStore.pagination.totalPages }}
        </span>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="!auditStore.hasPreviousPage"
            @click="auditStore.previousPage()"
          >
            <ChevronLeft class="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!auditStore.hasNextPage"
            @click="auditStore.nextPage()"
          >
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { format, subHours } from 'date-fns'
import { ru } from 'date-fns/locale'
import { MessageSquare, Search, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CalendarComponent from '@/components/ui/calendar.vue'
import Popover from '@/components/ui/popover.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/SelectTrigger.vue'
import SelectContent from '@/components/ui/SelectContent.vue'
import SelectValue from '@/components/ui/SelectValue.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import { cn } from '@/lib/utils'
import { useAuditStore } from '@/stores/auditStore'
import { localizeAuditAction } from '@/lib/utils/auditLocale'
import apiClient from '@/lib/api/client'
import type { PaginatedResponse, User } from '@/types/api'

const { t, locale } = useI18n()
const auditStore = useAuditStore()

// Filter state
const searchTerm = ref('')
const actionFilter = ref('all')
const userFilter = ref('all')

// Users list for dropdown
const usersList = ref<User[]>([])

// Known actions from backend (hardcoded — they are fixed in task_workflow.py)
const knownActions = [
  'task_created',
  'task_assigned',
  'reassign_reporting_radiologist',
  'reassign_validating_radiologist',
  'task_in_progress',
  'task_report_created',
  'task_report_edited_by_validator',
  'task_report_translated',
  'task_report_assigned_for_validation',
  'task_report_under_validation',
  'task_report_returned_for_revision',
  'task_report_finalized',
  'task_report_delivered',
]

// Date filter - default last 24 hours
const now = new Date()
const dateFrom = ref<Date | null>(subHours(now, 24))
const timeFrom = ref(format(subHours(now, 24), 'HH:mm'))
const dateTo = ref<Date | null>(now)
const timeTo = ref(format(now, 'HH:mm'))

// Locale for date-fns
const dateLocale = computed(() => locale.value === 'ru' ? ru : undefined)

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "d MMM yyyy HH:mm", { locale: dateLocale.value })
}

// Format raw backend action (snake_case) to Title Case for i18n lookup
const formatActionName = (action: string) => {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const getLocalizedAction = (action: string) => {
  // Try raw action first, then formatted version
  const raw = localizeAuditAction(action, t)
  if (raw !== action) return raw
  return localizeAuditAction(formatActionName(action), t)
}

const hasActiveFilters = computed(() => {
  return searchTerm.value !== '' || actionFilter.value !== 'all' || userFilter.value !== 'all'
})

// Build full filters object for server-side request
function buildFilters() {
  const from = dateFrom.value ? new Date(dateFrom.value) : undefined
  if (from) {
    const [fh, fm] = timeFrom.value.split(':').map(Number)
    from.setHours(fh, fm, 0, 0)
  }

  const to = dateTo.value ? new Date(dateTo.value) : undefined
  if (to) {
    const [th, tm] = timeTo.value.split(':').map(Number)
    to.setHours(th, tm, 59, 999)
  }

  return {
    dateFrom: from,
    dateTo: to,
    action: actionFilter.value !== 'all' ? actionFilter.value : undefined,
    userId: userFilter.value !== 'all' ? Number(userFilter.value) : undefined,
    accessionNumber: searchTerm.value.trim() || undefined,
  }
}

// All filters go through server
async function fetchWithFilters() {
  await auditStore.fetchAuditLog(buildFilters(), 1)
}

function onActionFilterChange(value: string) {
  actionFilter.value = value
  fetchWithFilters()
}

function onUserFilterChange(value: string) {
  userFilter.value = value
  fetchWithFilters()
}

function clearAllFilters() {
  searchTerm.value = ''
  actionFilter.value = 'all'
  userFilter.value = 'all'
  const n = new Date()
  dateFrom.value = subHours(n, 24)
  timeFrom.value = format(subHours(n, 24), 'HH:mm')
  dateTo.value = n
  timeTo.value = format(n, 'HH:mm')
  // fetchWithFilters will be triggered by date watch
}

async function fetchUsers() {
  try {
    const response = await apiClient.get<PaginatedResponse<User>>('/api/v1/admin/users', {
      params: { per_page: 100 },
    })
    usersList.value = response.data.items
  } catch (error) {
    console.warn('Failed to fetch users for filter:', error)
  }
}

// Debounced refetch when date or search changes
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch([dateFrom, timeFrom, dateTo, timeTo, searchTerm], () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(fetchWithFilters, 500)
})

onMounted(async () => {
  await Promise.all([fetchWithFilters(), fetchUsers()])
})
</script>
