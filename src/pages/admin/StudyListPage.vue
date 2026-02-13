<template>
  <div>
    <PageHeader
      :title="t('studyList.title')"
      :subtitle="studyStore.loading ? t('common.loading') : t('studyList.subtitle', { count: filteredStudies.length })"
    />

    <!-- Loading State -->
    <div v-if="studyStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="studyStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ studyStore.error }}
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
              :placeholder="t('studyList.searchPlaceholder')"
              :model-value="searchTerm"
              @update:model-value="searchTerm = $event"
              class="pl-9"
            />
          </div>
        </div>
        <Select :model-value="statusFilter" @update:model-value="statusFilter = $event as StudyStatus | 'all'">
          <SelectTrigger class="w-[120px]">
            <SelectValue :placeholder="t('common.status')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select :model-value="clientFilter" @update:model-value="clientFilter = $event">
          <SelectTrigger class="w-[180px]">
            <SelectValue :placeholder="t('studyList.clientFilter')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('studyList.allClients') }}</SelectItem>
            <SelectItem v-for="c in clients" :key="c" :value="c">{{ c }}</SelectItem>
          </SelectContent>
        </Select>
        <Select :model-value="modalityFilter" @update:model-value="modalityFilter = $event">
          <SelectTrigger class="w-[120px]">
            <SelectValue :placeholder="t('studyList.modalityFilter')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('studyList.allModalities') }}</SelectItem>
            <SelectItem v-for="m in modalities" :key="m" :value="m">{{ m }}</SelectItem>
          </SelectContent>
        </Select>

        <!-- Date Range Filter - From -->
        <Popover>
          <template #trigger>
            <Button variant="outline" :class="cn(
              'w-[180px] justify-start text-left font-normal',
              !dateFrom && 'text-muted-foreground'
            )">
              <Calendar class="mr-2 h-4 w-4" />
              {{ dateFrom ? `${format(dateFrom, 'MMM d')} ${timeFrom}` : t('studyList.fromDateTime') }}
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
              'w-[180px] justify-start text-left font-normal',
              !dateTo && 'text-muted-foreground'
            )">
              <Calendar class="mr-2 h-4 w-4" />
              {{ dateTo ? `${format(dateTo, 'MMM d')} ${timeTo}` : t('studyList.toDateTime') }}
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

        <Button v-if="dateFrom || dateTo" variant="ghost" size="sm" @click="clearDateFilters">
          {{ t('studyList.clearFilters') }}
        </Button>
      </div>
    </div>

    <!-- Table -->
    <div class="clinical-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('studyList.headers.studyId') }}</th>
              <th>{{ t('studyList.headers.patient') }}</th>
              <th>{{ t('studyList.headers.client') }}</th>
              <th>{{ t('studyList.headers.modalityArea') }}</th>
              <th>{{ t('studyList.headers.received') }}</th>
              <th>{{ t('studyList.headers.status') }}</th>
              <th>{{ t('studyList.headers.urgency') }}</th>
              <th>{{ t('studyList.headers.assignedTo') }}</th>
              <th>{{ t('studyList.headers.deadline') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="study in filteredStudies"
              :key="study.id"
              @click="handleRowClick(study, $event)"
              class="cursor-pointer"
            >
              <td class="font-mono text-xs font-medium">{{ study.accessionNumber }}</td>
              <td>
                <div class="text-sm">{{ study.patientId }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ study.sex }}/{{ study.age }}y
                </div>
              </td>
              <td class="text-sm">{{ study.clientName }}</td>
              <td>
                <LinkedBodyAreasDisplay :study="study" :all-studies="studyStore.studies" />
              </td>
              <td>
                <div class="text-sm">{{ format(parseISO(study.receivedAt), 'MMM d, yyyy') }}</div>
                <div class="text-xs text-muted-foreground">{{ format(parseISO(study.receivedAt), 'HH:mm') }}</div>
              </td>
              <td>
                <StatusBadge :status="study.status" />
              </td>
              <td>
                <UrgencyBadge :urgency="study.urgency" />
              </td>
              <td class="text-sm">
                {{ study.assignedPhysician || t('common.unassigned') }}
              </td>
              <td>
                <DeadlineTimer :deadline="study.deadline" />
              </td>
              <td @click.stop>
                <DropdownMenu>
                  <template #trigger>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreHorizontal class="w-4 h-4" />
                    </Button>
                  </template>
                  <DropdownMenuItem>
                    <Download class="w-4 h-4 mr-2" />
                    {{ t('studyList.downloadDicom') }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="router.push(`/task/${study.id}`)">
                    <UserPlus class="w-4 h-4 mr-2" />
                    {{ t('studyList.reassign') }}
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, MoreHorizontal, Download, UserPlus, Calendar, Clock } from 'lucide-vue-next'
import { format, parseISO, isAfter, isBefore, set } from 'date-fns'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import LinkedBodyAreasDisplay from '@/components/ui/LinkedBodyAreasDisplay.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/SelectTrigger.vue'
import SelectContent from '@/components/ui/SelectContent.vue'
import SelectValue from '@/components/ui/SelectValue.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import Popover from '@/components/ui/popover.vue'
import CalendarComponent from '@/components/ui/calendar.vue'
import type { StudyStatus, Study } from '@/types/study'
import { useStudyStore } from '@/stores/studyStore'
import { onMounted } from 'vue'
import DropdownMenu from '@/components/ui/dropdown-menu.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'
import DropdownMenuSeparator from '@/components/ui/DropdownMenuSeparator.vue'

const router = useRouter()
const studyStore = useStudyStore()
const { t } = useI18n()

const statusOptions = computed(() => [
  { value: 'all' as const, label: t('studyList.allStatuses') },
  { value: 'new' as const, label: t('status.new') },
  { value: 'assigned' as const, label: t('status.assigned') },
  { value: 'in-progress' as const, label: t('status.inProgress') },
  { value: 'draft-ready' as const, label: t('status.draftReady') },
  { value: 'translated' as const, label: t('status.translated') },
  { value: 'assigned-for-validation' as const, label: t('status.assignedForValidation') },
  { value: 'under-validation' as const, label: t('status.underValidation') },
  { value: 'returned' as const, label: t('status.returned') },
  { value: 'finalized' as const, label: t('status.finalized') },
  { value: 'delivered' as const, label: t('status.delivered') },
])

const searchTerm = ref('')
const statusFilter = ref<StudyStatus | 'all'>('all')
const clientFilter = ref<string>('all')
const modalityFilter = ref<string>('all')
const dateFrom = ref<Date | undefined>(undefined)
const dateTo = ref<Date | undefined>(undefined)
const timeFrom = ref<string>('00:00')
const timeTo = ref<string>('23:59')

const clients = computed(() => [...new Set(studyStore.studies.map((s) => s.clientName))])
const modalities = computed(() => [...new Set(studyStore.studies.map((s) => s.modality))])

const getDateTimeFrom = () => {
  if (!dateFrom.value) return null
  const [hours, minutes] = timeFrom.value.split(':').map(Number)
  return set(dateFrom.value, { hours, minutes, seconds: 0 })
}

const getDateTimeTo = () => {
  if (!dateTo.value) return null
  const [hours, minutes] = timeTo.value.split(':').map(Number)
  return set(dateTo.value, { hours, minutes, seconds: 59 })
}

const filteredStudies = computed(() => {
  return studyStore.studies.filter((study) => {
    const matchesSearch =
      study.id.toString().toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      study.patientId.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      study.clientName.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || study.status === statusFilter.value
    const matchesClient = clientFilter.value === 'all' || study.clientName === clientFilter.value
    const matchesModality = modalityFilter.value === 'all' || study.modality === modalityFilter.value
    
    const receivedDate = parseISO(study.receivedAt)
    const dateTimeFrom = getDateTimeFrom()
    const dateTimeTo = getDateTimeTo()
    
    const matchesDateFrom = !dateTimeFrom || isAfter(receivedDate, dateTimeFrom) || receivedDate.getTime() === dateTimeFrom.getTime()
    const matchesDateTo = !dateTimeTo || isBefore(receivedDate, dateTimeTo)
    
    return matchesSearch && matchesStatus && matchesClient && matchesModality && matchesDateFrom && matchesDateTo
  })
})

const handleRowClick = (study: Study, event: MouseEvent) => {
  // Don't navigate if clicking on the dropdown menu or its trigger
  const target = event.target as HTMLElement
  if (target.closest('[role="menu"]') || target.closest('button')) {
    return
  }
  router.push(`/task/${study.id}`)
}

const clearDateFilters = () => {
  dateFrom.value = undefined
  dateTo.value = undefined
  timeFrom.value = '00:00'
  timeTo.value = '23:59'
}

onMounted(async () => {
  await studyStore.fetchStudies()
})
</script>

