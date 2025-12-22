<template>
  <div>
    <PageHeader
      title="Study List"
      :subtitle="`${filteredStudies.length} studies`"
    />

    <!-- Filters -->
    <div class="clinical-card mb-6">
      <div class="p-4 flex flex-wrap md:flex-nowrap gap-4">
        <div class="w-full md:w-[330px] flex-shrink-0">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Patient ID, or Client..."
              :model-value="searchTerm"
              @update:model-value="searchTerm = $event"
              class="pl-9"
            />
          </div>
        </div>
        <Select :model-value="statusFilter" @update:model-value="statusFilter = $event as StudyStatus | 'all'">
          <SelectTrigger class="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select :model-value="clientFilter" @update:model-value="clientFilter = $event">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem v-for="c in clients" :key="c" :value="c">{{ c }}</SelectItem>
          </SelectContent>
        </Select>
        <Select :model-value="modalityFilter" @update:model-value="modalityFilter = $event">
          <SelectTrigger class="w-[120px]">
            <SelectValue placeholder="Modality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
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
              {{ dateFrom ? `${format(dateFrom, 'MMM d')} ${timeFrom}` : 'From date & time' }}
            </Button>
          </template>
          <CalendarComponent
            :selected="dateFrom"
            @select="dateFrom = $event"
          />
          <div class="border-t p-3">
            <Label class="text-xs text-muted-foreground">Time</Label>
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
              {{ dateTo ? `${format(dateTo, 'MMM d')} ${timeTo}` : 'To date & time' }}
            </Button>
          </template>
          <CalendarComponent
            :selected="dateTo"
            @select="dateTo = $event"
          />
          <div class="border-t p-3">
            <Label class="text-xs text-muted-foreground">Time</Label>
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
          Clear
        </Button>
      </div>
    </div>

    <!-- Table -->
    <div class="clinical-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Study ID</th>
              <th>Patient</th>
              <th>Client</th>
              <th>Modality / Area</th>
              <th>Received</th>
              <th>Status</th>
              <th>Urgency</th>
              <th>Assigned To</th>
              <th>Deadline</th>
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
              <td class="font-mono text-xs font-medium">{{ study.id }}</td>
              <td>
                <div class="text-sm">{{ study.patientId }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ study.sex }}/{{ study.age }}y
                </div>
              </td>
              <td class="text-sm">{{ study.clientName }}</td>
              <td>
                <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
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
                {{ study.assignedPhysician || 'Unassigned' }}
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
                    Download DICOM
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserPlus class="w-4 h-4 mr-2" />
                    Reassign
                  </DropdownMenuItem>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
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
import { mockStudies } from '@/data/mockData'
import type { StudyStatus, Study } from '@/types/study'
import DropdownMenu from '@/components/ui/dropdown-menu.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'
import DropdownMenuSeparator from '@/components/ui/DropdownMenuSeparator.vue'

const router = useRouter()

const statusOptions: { value: StudyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'draft-ready', label: 'Draft Ready' },
  { value: 'under-validation', label: 'Under Validation' },
  { value: 'returned', label: 'Returned' },
  { value: 'finalized', label: 'Finalized' },
  { value: 'delivered', label: 'Delivered' },
]

const searchTerm = ref('')
const statusFilter = ref<StudyStatus | 'all'>('all')
const clientFilter = ref<string>('all')
const modalityFilter = ref<string>('all')
const dateFrom = ref<Date | undefined>(undefined)
const dateTo = ref<Date | undefined>(undefined)
const timeFrom = ref<string>('00:00')
const timeTo = ref<string>('23:59')

const clients = [...new Set(mockStudies.map((s) => s.clientName))]
const modalities = [...new Set(mockStudies.map((s) => s.modality))]

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
  return mockStudies.filter((study) => {
    const matchesSearch =
      study.id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
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
  router.push(`/study/${study.id}`)
}

const clearDateFilters = () => {
  dateFrom.value = undefined
  dateTo.value = undefined
  timeFrom.value = '00:00'
  timeTo.value = '23:59'
}
</script>

