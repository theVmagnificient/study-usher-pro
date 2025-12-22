<template>
  <div>
    <PageHeader
      title="User Management"
      subtitle="Manage physicians and their assignments"
    >
      <template #actions>
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Add Physician
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-3 gap-6">
      <!-- Physician List -->
      <div class="col-span-2">
        <div class="clinical-card overflow-hidden">
          <!-- Search Filter -->
          <div class="p-4 border-b border-border">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                :model-value="searchQuery"
                @update:model-value="searchQuery = $event"
                class="pl-9"
              />
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Physician</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Modalities</th>
                <th>Workload</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="physician in filteredPhysicians"
                :key="physician.id"
                :class="cn(
                  'cursor-pointer',
                  selectedPhysician === physician.id && 'bg-accent'
                )"
                @click="selectedPhysician = physician.id"
              >
                <td>
                  <div class="font-medium text-sm">{{ physician.fullName }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ physician.statistics.total.toLocaleString() }} studies completed
                  </div>
                </td>
                <td @click.stop>
                  <Select
                    :model-value="physician.role"
                    @update:model-value="handleRoleChange(physician.id, $event as UserRole)"
                  >
                    <SelectTrigger :class="cn(
                      'w-[130px] h-8 text-xs border',
                      roleBadgeColors[physician.role]
                    )">
                      <Shield class="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full bg-destructive" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="reporting-radiologist">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full bg-primary" />
                          Reporting
                        </div>
                      </SelectItem>
                      <SelectItem value="validating-radiologist">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full bg-status-finalized" />
                          Validating
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td>
                  <div class="text-sm">{{ physician.phone }}</div>
                  <div v-if="physician.telegram" class="text-xs text-muted-foreground">{{ physician.telegram }}</div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <Badge v-for="m in physician.supportedModalities" :key="m" variant="secondary" class="text-xs">{{ m }}</Badge>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div :class="cn(
                      'text-sm font-medium',
                      physician.activeStudies >= physician.maxActiveStudies && 'text-destructive'
                    )">
                      {{ physician.activeStudies }}/{{ physician.maxActiveStudies }}
                    </div>
                    <div class="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        :class="cn(
                          'h-full transition-all',
                          physician.activeStudies >= physician.maxActiveStudies
                            ? 'bg-destructive'
                            : 'bg-primary'
                        )"
                        :style="{ width: `${(physician.activeStudies / physician.maxActiveStudies) * 100}%` }"
                      />
                    </div>
                  </div>
                </td>
                <td @click.stop>
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      @click="openSchedule(physician.id)"
                      title="Manage Schedule"
                    >
                      <CalendarClock class="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      class="h-8 w-8"
                      @click="handleEdit(physician.id)"
                      title="Edit Physician"
                    >
                      <Edit2 class="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Physician Details Panel -->
      <div class="col-span-1">
        <div v-if="selected" class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ selected.fullName }}</h3>
            <Badge
              variant="outline"
              :class="cn('text-xs', roleBadgeColors[selected.role])"
            >
              {{ roleLabels[selected.role] }}
            </Badge>
          </div>
          <div class="clinical-card-body space-y-4">
            <!-- Schedule -->
            <div>
              <div class="flex items-center justify-between">
                <h4 class="section-header">Default Schedule</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 text-xs"
                  @click="openSchedule(selected.id)"
                >
                  <CalendarClock class="w-3 h-3 mr-1" />
                  Manage
                </Button>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm">
                  <Calendar class="w-4 h-4 text-muted-foreground" />
                  <span>{{ selected.schedule.days.join(", ") }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <Clock class="w-4 h-4 text-muted-foreground" />
                  <span>{{ selected.schedule.hours.start }} - {{ selected.schedule.hours.end }}</span>
                </div>
              </div>
            </div>

            <!-- Body Areas -->
            <div>
              <h4 class="section-header">Body Areas</h4>
              <div class="flex flex-wrap gap-1">
                <Badge v-for="area in selected.supportedBodyAreas" :key="area" variant="outline" class="text-xs">{{ area }}</Badge>
              </div>
            </div>

            <!-- Statistics -->
            <div>
              <h4 class="section-header">Statistics by Modality</h4>
              <div class="space-y-2">
                <div
                  v-for="[modality, count] in Object.entries(selected.statistics.byModality)
                    .filter(([_, count]) => count > 0)
                    .sort(([, a], [, b]) => (b as number) - (a as number))"
                  :key="modality"
                  class="flex items-center justify-between text-sm"
                >
                  <span>{{ modality }}</span>
                  <span class="font-medium">{{ (count as number).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="clinical-card p-8 text-center text-muted-foreground">
          <p class="text-sm">Select a physician to view details</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Edit2, Calendar, Clock, CalendarClock, Shield, Search } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import { mockPhysicians } from '@/data/mockData'
import Badge from '@/components/ui/badge.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/SelectTrigger.vue'
import SelectContent from '@/components/ui/SelectContent.vue'
import SelectValue from '@/components/ui/SelectValue.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import { cn } from '@/lib/utils'
import type { UserRole, Physician } from '@/types/study'

const router = useRouter()

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  "reporting-radiologist": "Reporting",
  "validating-radiologist": "Validating",
}

const roleBadgeColors: Record<UserRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  "reporting-radiologist": "bg-primary/10 text-primary border-primary/20",
  "validating-radiologist": "bg-status-finalized/10 text-status-finalized border-status-finalized/20",
}

const selectedPhysician = ref<string | null>(null)
const physicians = ref<Physician[]>(mockPhysicians)
const searchQuery = ref("")

const filteredPhysicians = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return physicians.value.filter(p =>
    p.fullName.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
  )
})

const selected = computed(() =>
  physicians.value.find(p => p.id === selectedPhysician.value)
)

const handleRoleChange = (physicianId: string, newRole: UserRole) => {
  physicians.value = physicians.value.map(p =>
    p.id === physicianId ? { ...p, role: newRole } : p
  )
}

const openSchedule = (physicianId: string) => {
  router.push(`/schedule/${physicianId}`)
}

const handleEdit = (physicianId: string) => {
  // TODO: Implement edit physician functionality
  console.log('Edit physician:', physicianId)
  // This could open a dialog or navigate to an edit page
}
</script>
