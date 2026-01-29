<template>
  <div>
    <PageHeader
      :title="t('taskList.title')"
      :subtitle="loading ? t('common.loading') : t('taskList.subtitle', { count: filteredTasks.length })"
    />

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
      <!-- Filters -->
      <div class="clinical-card mb-6">
        <div class="p-4 flex flex-wrap md:flex-nowrap gap-4">
          <div class="w-full md:w-[330px] flex-shrink-0">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                :placeholder="t('taskList.searchPlaceholder')"
                :model-value="searchTerm"
                @update:model-value="searchTerm = $event"
                class="pl-9"
              />
            </div>
          </div>
          <Select :model-value="statusFilter" @update:model-value="statusFilter = $event">
            <SelectTrigger class="w-[200px]">
              <SelectValue :placeholder="t('common.status')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Table -->
      <div class="clinical-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('taskList.headers.studyId') }}</th>
                <th>{{ t('taskList.headers.patient') }}</th>
                <th>{{ t('taskList.headers.modalityArea') }}</th>
                <th>{{ t('taskList.headers.status') }}</th>
                <th>{{ t('taskList.headers.urgency') }}</th>
                <th>{{ t('taskList.headers.deadline') }}</th>
                <th>{{ t('taskList.headers.reportingPhysician') }}</th>
                <th>{{ t('taskList.headers.validatingPhysician') }}</th>
                <th>{{ t('taskList.headers.created') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="task in filteredTasks"
                :key="task.id"
                @click="handleRowClick(task, $event)"
                class="cursor-pointer"
              >
                <td class="font-mono text-xs">{{ task.study?.accession_number || 'N/A' }}</td>
                <td>
                  <div class="text-sm" v-if="task.study">{{ task.study.patient_id }}</div>
                  <div class="text-xs text-muted-foreground" v-if="task.study">
                    {{ task.study.patient_sex }}/{{ task.study.patient_age }}y
                  </div>
                </td>
                <td class="text-sm">
                  <span v-if="task.client_type">
                    {{ formatModality(task.client_type.modality) }} / {{ formatBodyArea(task.client_type.body_area) }}
                  </span>
                  <span v-else class="text-muted-foreground">N/A</span>
                </td>
                <td>
                  <StatusBadge :status="mapBackendStatusToFrontend(task.status)" />
                </td>
                <td>
                  <UrgencyBadge :urgency="task.urgency" />
                </td>
                <td>
                  <template v-if="task.status !== 'delivered'">
                    <DeadlineTimer
                      v-if="task.study && task.client_type"
                      :deadline="calculateDeadline(task.study.study_datetime, task.client_type.expected_tat_hours)"
                    />
                    <span v-else class="text-muted-foreground text-sm">N/A</span>
                  </template>
                  <span v-else class="text-muted-foreground text-sm">—</span>
                </td>
                <td class="text-sm">
                  <span v-if="task.reporting_radiologist">
                    {{ task.reporting_radiologist.first_name }} {{ task.reporting_radiologist.last_name }}
                  </span>
                  <span v-else class="text-muted-foreground">{{ t('common.unassigned') }}</span>
                </td>
                <td class="text-sm">
                  <span v-if="task.validating_radiologist">
                    {{ task.validating_radiologist.first_name }} {{ task.validating_radiologist.last_name }}
                  </span>
                  <span v-else class="text-muted-foreground">{{ t('common.unassigned') }}</span>
                </td>
                <td>
                  <div class="text-sm">{{ format(parseISO(task.created_at), 'MMM d, yyyy') }}</div>
                  <div class="text-xs text-muted-foreground">{{ format(parseISO(task.created_at), 'HH:mm') }}</div>
                </td>
                <td @click.stop>
                  <DropdownMenu>
                    <template #trigger>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreHorizontal class="w-4 h-4" />
                      </Button>
                    </template>
                    <DropdownMenuItem @click="router.push(`/task/${task.id}`)">
                      <UserPlus class="w-4 h-4 mr-2" />
                      {{ t('taskList.viewDetails') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="router.push(`/report/${task.id}`)">
                      <FileText class="w-4 h-4 mr-2" />
                      {{ t('taskList.viewReport') }}
                    </DropdownMenuItem>
                  </DropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, MoreHorizontal, UserPlus, FileText } from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/SelectTrigger.vue'
import SelectContent from '@/components/ui/SelectContent.vue'
import SelectValue from '@/components/ui/SelectValue.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import DropdownMenu from '@/components/ui/dropdown-menu.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'
import apiClient from '@/lib/api/client'
import type { TaskWithEmbedded } from '@/types/api'
import type { StudyStatus } from '@/types/study'
import { formatBodyArea, calculateDeadline } from '@/lib/mappers/utils'

const router = useRouter()
const { t } = useI18n()

const tasks = ref<TaskWithEmbedded[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchTerm = ref('')
const statusFilter = ref<string>('all')

const statusOptions = computed(() => [
  { value: 'all', label: t('taskList.allStatuses') },
  { value: 'new', label: t('status.new') },
  { value: 'assigned', label: t('status.assigned') },
  { value: 'in_progress', label: t('status.inProgress') },
  { value: 'draft_ready', label: t('status.draftReady') },
  { value: 'translated', label: t('status.translated') },
  { value: 'assigned_for_validation', label: t('status.assignedForValidation') },
  { value: 'under_validation', label: t('status.underValidation') },
  { value: 'returned', label: t('status.returned') },
  { value: 'finalized', label: t('status.finalized') },
  { value: 'delivered', label: t('status.delivered') },
])

const filteredTasks = computed(() => {
  // All filtering is now done server-side
  return tasks.value
})

// Map backend status format to frontend format
function mapBackendStatusToFrontend(status: string): StudyStatus {
  const statusMap: Record<string, StudyStatus> = {
    'new': 'new',
    'assigned': 'assigned',
    'in_progress': 'in-progress',
    'draft_ready': 'draft-ready',
    'translated': 'translated',
    'assigned_for_validation': 'assigned-for-validation',
    'under_validation': 'under-validation',
    'returned': 'returned',
    'finalized': 'finalized',
    'delivered': 'delivered',
  }
  return statusMap[status] || 'new'
}

// Format modality for display
function formatModality(modality: string): string {
  if (modality === 'MR') return 'MRI'
  return modality
}

async function fetchTasks() {
  loading.value = true
  error.value = null

  try {
    const params: Record<string, any> = { per_page: 100 }

    // Add filters to params
    if (searchTerm.value) {
      params.search = searchTerm.value
    }

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }

    const response = await apiClient.get<{ items: TaskWithEmbedded[], total: number }>('/api/v1/admin/tasks', {
      params
    })
    tasks.value = response.data.items
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch tasks'
    console.error('Error fetching tasks:', err)
  } finally {
    loading.value = false
  }
}

function handleRowClick(task: TaskWithEmbedded, event: MouseEvent) {
  // Don't navigate if clicking on the dropdown menu or its trigger
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('[role="menu"]')) {
    return
  }

  router.push(`/task/${task.id}`)
}

// Watch for filter changes and refetch with debounce
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch([searchTerm, statusFilter], () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  debounceTimeout = setTimeout(() => {
    fetchTasks()
  }, 300)
})

onMounted(() => {
  fetchTasks()
})
</script>
