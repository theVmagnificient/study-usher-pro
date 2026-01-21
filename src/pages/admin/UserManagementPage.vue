<template>
  <div>
    <PageHeader
      :title="t('userManagement.title')"
      :subtitle="userStore.loading ? t('common.loading') : t('userManagement.subtitle', { count: userStore.users.length })"
    >
      <template #actions>
        <Button @click="handleNew">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('userManagement.addPhysician') }}
        </Button>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="userStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="userStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ userStore.error }}
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-3 gap-6">
      <!-- Physician List -->
      <div class="col-span-2">
        <div class="clinical-card overflow-hidden">
          <!-- Search Filter -->
          <div class="p-4 border-b border-border">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                :placeholder="t('userManagement.searchPlaceholder')"
                :model-value="searchQuery"
                @update:model-value="searchQuery = $event"
                class="pl-9"
              />
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('userManagement.headers.physician') }}</th>
                <th>{{ t('userManagement.headers.role') }}</th>
                <th>{{ t('userManagement.headers.contact') }}</th>
                <th>{{ t('userManagement.headers.modalities') }}</th>
                <th>{{ t('userManagement.headers.workload') }}</th>
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
                    {{ t('userManagement.studiesCompleted', { count: physician.statistics.total }) }}
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
                          {{ t('roles.admin') }}
                        </div>
                      </SelectItem>
                      <SelectItem value="reporting-radiologist">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full bg-primary" />
                          {{ t('roles.reportingRadiologist') }}
                        </div>
                      </SelectItem>
                      <SelectItem value="validating-radiologist">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full bg-status-finalized" />
                          {{ t('roles.validatingRadiologist') }}
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
                      :title="t('userManagement.manageSchedule')"
                    >
                      <CalendarClock class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      @click="handleEdit(physician.id)"
                      :title="t('userManagement.editPhysician')"
                    >
                      <Edit2 class="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      @click="handleDelete(physician.id)"
                      :title="t('userManagement.deletePhysician')"
                    >
                      <Trash2 class="w-4 h-4" />
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
                <h4 class="section-header">{{ t('userManagement.defaultSchedule') }}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 text-xs"
                  @click="openSchedule(selected.id)"
                >
                  <CalendarClock class="w-3 h-3 mr-1" />
                  {{ t('userManagement.manage') }}
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
              <h4 class="section-header">{{ t('userManagement.bodyAreas') }}</h4>
              <div class="flex flex-wrap gap-1">
                <Badge v-for="area in selected.supportedBodyAreas" :key="area" variant="outline" class="text-xs">{{ area }}</Badge>
              </div>
            </div>

            <!-- Statistics -->
            <div>
              <h4 class="section-header">{{ t('userManagement.statisticsByModality') }}</h4>
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
          <p class="text-sm">{{ t('userManagement.selectPhysician') }}</p>
        </div>
      </div>
    </div>

    <!-- Edit/Create Physician Dialog -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ editingPhysician ? t('userManagement.editDialog.titleEdit') : t('userManagement.editDialog.titleAdd') }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>{{ t('userManagement.editDialog.firstName') }}</Label>
              <Input v-model="formData.firstName" :placeholder="t('userManagement.editDialog.firstNamePlaceholder')" />
            </div>
            <div class="grid gap-2">
              <Label>{{ t('userManagement.editDialog.lastName') }}</Label>
              <Input v-model="formData.lastName" :placeholder="t('userManagement.editDialog.lastNamePlaceholder')" />
            </div>
          </div>
          <div class="grid gap-2">
            <Label>{{ t('userManagement.editDialog.email') }}</Label>
            <Input v-model="formData.email" type="email" :placeholder="t('userManagement.editDialog.emailPlaceholder')" />
          </div>
          <div class="grid gap-2">
            <Label>{{ t('userManagement.editDialog.phone') }}</Label>
            <Input v-model="formData.phone" :placeholder="t('userManagement.editDialog.phonePlaceholder')" />
          </div>
          <div class="grid gap-2">
            <Label>{{ t('userManagement.editDialog.role') }}</Label>
            <Select v-model="formData.role">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{{ t('roles.admin') }}</SelectItem>
                <SelectItem value="reporting-radiologist">{{ t('roles.reportingRadiologist') }}</SelectItem>
                <SelectItem value="validating-radiologist">{{ t('roles.validatingRadiologist') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">{{ t('common.cancel') }}</Button>
          <Button @click="handleSave">{{ editingPhysician ? t('userManagement.editDialog.update') : t('userManagement.editDialog.create') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{{ t('userManagement.deleteDialog.title') }}</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm text-muted-foreground">
            {{ t('userManagement.deleteDialog.message') }}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false">{{ t('common.cancel') }}</Button>
          <Button variant="destructive" @click="confirmDelete">{{ t('userManagement.deleteDialog.delete') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Edit2, Calendar, Clock, CalendarClock, Shield, Search, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import { useUserStore } from '@/stores/userStore'
import Badge from '@/components/ui/badge.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/SelectTrigger.vue'
import SelectContent from '@/components/ui/SelectContent.vue'
import SelectValue from '@/components/ui/SelectValue.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import { cn } from '@/lib/utils'
import type { UserRole, Physician } from '@/types/study'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const roleLabels = computed(() => ({
  admin: t('roles.admin'),
  "reporting-radiologist": t('roles.reportingRadiologist'),
  "validating-radiologist": t('roles.validatingRadiologist'),
}))

const roleBadgeColors: Record<UserRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  "reporting-radiologist": "bg-primary/10 text-primary border-primary/20",
  "validating-radiologist": "bg-status-finalized/10 text-status-finalized border-status-finalized/20",
}

const selectedPhysician = ref<string | null>(null)
const searchQuery = ref("")
const isDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const editingPhysician = ref<string | null>(null)
const deletingPhysician = ref<string | null>(null)

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'reporting-radiologist' as UserRole
})

const filteredPhysicians = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return userStore.users.filter(p =>
    p.fullName.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
  )
})

const selected = computed(() =>
  userStore.users.find(p => p.id === selectedPhysician.value)
)

const handleRoleChange = async (physicianId: string, newRole: UserRole) => {
  const physician = userStore.users.find(p => p.id === physicianId)
  if (physician) {
    const userId = parseInt(physician.id.split('-')[1])
    await userStore.updateUser(userId, { role: newRole })
  }
}

const openSchedule = (physicianId: string) => {
  router.push(`/schedule/${physicianId}`)
}

const handleNew = () => {
  editingPhysician.value = null
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'reporting-radiologist'
  }
  isDialogOpen.value = true
}

const handleEdit = (physicianId: string) => {
  const physician = userStore.users.find(p => p.id === physicianId)
  if (physician) {
    editingPhysician.value = physicianId
    const [firstName, ...lastNameParts] = physician.fullName.split(' ')
    formData.value = {
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      email: physician.email || '',
      phone: physician.phone || '',
      role: physician.role
    }
    isDialogOpen.value = true
  }
}

const handleDelete = (physicianId: string) => {
  deletingPhysician.value = physicianId
  isDeleteDialogOpen.value = true
}

const handleSave = async () => {
  if (editingPhysician.value) {
    // Update existing physician
    const physician = userStore.users.find(p => p.id === editingPhysician.value)
    if (physician) {
      const userId = parseInt(physician.id.split('-')[1])
      await userStore.updateUser(userId, {
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        email: formData.value.email,
        phone: formData.value.phone,
        role: formData.value.role
      })
    }
  } else {
    // Create new physician
    await userStore.createUser({
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      email: formData.value.email,
      password: 'ChangeMe123!',
      phone: formData.value.phone,
      role: formData.value.role
    })
  }
  isDialogOpen.value = false
}

const confirmDelete = async () => {
  if (deletingPhysician.value) {
    const physician = userStore.users.find(p => p.id === deletingPhysician.value)
    if (physician) {
      const userId = parseInt(physician.id.split('-')[1])
      await userStore.deleteUser(userId)
    }
  }
  isDeleteDialogOpen.value = false
  deletingPhysician.value = null
}

onMounted(async () => {
  await userStore.fetchUsers()
})
</script>
