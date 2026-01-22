<template>
  <div>
    <PageHeader
      :title="t('taskTypes.title')"
      :subtitle="clientTypeStore.loading ? t('common.loading') : t('taskTypes.subtitle', { count: clientTypeStore.clientTypes.length })"
    >
      <template #actions>
        <Button @click="handleNew">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('taskTypes.addTaskType') }}
        </Button>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="clientTypeStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="clientTypeStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ clientTypeStore.error }}
    </div>

    <!-- Content -->
    <div v-else class="clinical-card overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('taskTypes.headers.client') }}</th>
            <th>{{ t('taskTypes.headers.modality') }}</th>
            <th>{{ t('taskTypes.headers.bodyArea') }}</th>
            <th>{{ t('taskTypes.headers.priors') }}</th>
            <th>{{ t('taskTypes.headers.expectedTat') }}</th>
            <th>{{ t('taskTypes.headers.price') }}</th>
            <th>{{ t('taskTypes.headers.payout') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tt in clientTypeStore.clientTypes" :key="tt.id">
            <td class="text-sm font-medium">{{ tt.client }}</td>
            <td class="text-sm">{{ tt.modality }}</td>
            <td class="text-sm">{{ tt.bodyArea }}</td>
            <td>
              <span :class="['status-badge', tt.hasPriors ? 'status-assigned' : 'status-new']">
                {{ tt.hasPriors ? t('common.yes') : t('common.no') }}
              </span>
            </td>
            <td class="text-sm">{{ t('taskTypes.hours', { count: tt.expectedTAT }) }}</td>
            <td class="text-sm font-medium">${{ tt.price }}</td>
            <td class="text-sm">${{ tt.physicianPayout }}</td>
            <td>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleEdit(tt.id)">
                  <Edit2 class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  @click="handleDeleteClick(tt)"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog :open="isDialogOpen" @update:open="handleDialogClose">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? t('taskTypes.dialog.titleEdit') : t('taskTypes.dialog.titleNew') }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <!-- Client Selector -->
          <div class="grid gap-2">
            <Label>{{ t('taskTypes.dialog.client') }}</Label>
            <Select v-model="formData.clientId" :disabled="loadingClients">
              <SelectTrigger>
                <SelectValue :placeholder="loadingClients ? t('common.loading') : t('taskTypes.dialog.clientPlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="client in clients"
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Modality and Body Area -->
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.modality') }}</Label>
              <Select v-model="formData.modality">
                <SelectTrigger>
                  <SelectValue :placeholder="t('common.filter')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CT">{{ t('modality.ct') }}</SelectItem>
                  <SelectItem value="MRI">{{ t('modality.mri') }}</SelectItem>
                  <SelectItem value="X-Ray">{{ t('modality.xray') }}</SelectItem>
                  <SelectItem value="US">{{ t('modality.us') }}</SelectItem>
                  <SelectItem value="PET">{{ t('modality.pet') }}</SelectItem>
                  <SelectItem value="NM">{{ t('modality.nm') }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.bodyArea') }}</Label>
              <Select v-model="formData.bodyArea">
                <SelectTrigger>
                  <SelectValue :placeholder="t('common.filter')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Head">{{ t('bodyArea.head') }}</SelectItem>
                  <SelectItem value="Neck">{{ t('bodyArea.neck') }}</SelectItem>
                  <SelectItem value="Chest">{{ t('bodyArea.chest') }}</SelectItem>
                  <SelectItem value="Abdomen">{{ t('bodyArea.abdomen') }}</SelectItem>
                  <SelectItem value="Pelvis">{{ t('bodyArea.pelvis') }}</SelectItem>
                  <SelectItem value="Spine">{{ t('bodyArea.spine') }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Has Priors Checkbox -->
          <div class="flex items-center gap-2">
            <Checkbox v-model:checked="formData.hasPriors" />
            <Label class="text-sm font-normal">{{ t('taskTypes.dialog.includesPriors') }}</Label>
          </div>

          <!-- TAT, Price, Payout -->
          <div class="grid grid-cols-3 gap-4">
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.tat') }}</Label>
              <Input v-model="formData.expectedTAT" type="number" placeholder="4" min="0" />
            </div>
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.price') }}</Label>
              <Input v-model="formData.price" type="number" placeholder="150" min="0" step="0.01" />
            </div>
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.payout') }}</Label>
              <Input v-model="formData.payout" type="number" placeholder="75" min="0" step="0.01" />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="formError" class="p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {{ formError }}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="handleDialogClose" :disabled="saving">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="handleSave" :disabled="saving || !isFormValid">
            {{ saving ? t('common.saving') : t('common.save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{{ t('taskTypes.deleteConfirm.title') }}</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm text-gray-600">
            {{ t('taskTypes.deleteConfirm.message') }}
          </p>
          <div v-if="taskTypeToDelete" class="mt-4 p-3 bg-gray-50 rounded-md">
            <p class="text-sm font-medium">{{ taskTypeToDelete.client }}</p>
            <p class="text-sm text-gray-600">{{ taskTypeToDelete.modality }} - {{ taskTypeToDelete.bodyArea }}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteConfirm = false" :disabled="deleting">
            {{ t('common.cancel') }}
          </Button>
          <Button variant="destructive" @click="handleDeleteConfirm" :disabled="deleting">
            {{ deleting ? t('common.deleting') : t('common.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Edit2, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/button.vue'
import { useClientTypeStore } from '@/stores/clientTypeStore'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/SelectTrigger.vue'
import SelectContent from '@/components/ui/SelectContent.vue'
import SelectValue from '@/components/ui/SelectValue.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import Checkbox from '@/components/ui/checkbox.vue'
import apiClient from '@/lib/api/client'
import { parseTaskTypeId } from '@/lib/mappers/utils'
import type { TaskType, Modality, BodyArea } from '@/types/study'
import type { Client } from '@/types/api'

const { t } = useI18n()
const clientTypeStore = useClientTypeStore()

// Dialog state
const isDialogOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)

// Form data
const formData = ref<{
  clientId: string | null
  modality: Modality | null
  bodyArea: BodyArea | null
  hasPriors: boolean
  expectedTAT: string
  price: string
  payout: string
}>({
  clientId: null,
  modality: null,
  bodyArea: null,
  hasPriors: false,
  expectedTAT: '4',
  price: '0',
  payout: '0',
})

// Clients data
const clients = ref<Client[]>([])
const loadingClients = ref(false)

// Delete confirmation state
const showDeleteConfirm = ref(false)
const taskTypeToDelete = ref<TaskType | null>(null)
const deleting = ref(false)

// Form validation
const isFormValid = computed(() => {
  return (
    formData.value.clientId !== null &&
    formData.value.modality !== null &&
    formData.value.bodyArea !== null &&
    parseFloat(formData.value.expectedTAT) > 0 &&
    parseFloat(formData.value.price) >= 0 &&
    parseFloat(formData.value.payout) >= 0
  )
})

// Fetch clients from API
async function fetchClients() {
  loadingClients.value = true
  try {
    const response = await apiClient.get<{ items: Client[] }>('/api/v1/admin/clients')
    clients.value = response.data.items || []
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    formError.value = 'Failed to load clients'
  } finally {
    loadingClients.value = false
  }
}

// Reset form data
function resetForm() {
  formData.value = {
    clientId: null,
    modality: null,
    bodyArea: null,
    hasPriors: false,
    expectedTAT: '4',
    price: '0',
    payout: '0',
  }
  formError.value = null
}

// Handle new task type
async function handleNew() {
  editingId.value = null
  resetForm()
  await fetchClients()
  isDialogOpen.value = true
}

// Handle edit task type
async function handleEdit(id: string) {
  editingId.value = id
  resetForm()

  await fetchClients()

  // Find the task type and populate form
  const taskType = clientTypeStore.clientTypes.find(tt => tt.id === id)
  if (taskType) {
    // Find client ID by name
    const client = clients.value.find(c => c.name === taskType.client)

    formData.value = {
      clientId: client?.id?.toString() || null,
      modality: taskType.modality,
      bodyArea: taskType.bodyArea,
      hasPriors: taskType.hasPriors,
      expectedTAT: taskType.expectedTAT.toString(),
      price: taskType.price.toString(),
      payout: taskType.physicianPayout.toString(),
    }
  }

  isDialogOpen.value = true
}

// Handle save
async function handleSave() {
  if (!isFormValid.value) {
    formError.value = 'Please fill in all required fields'
    return
  }

  saving.value = true
  formError.value = null

  try {
    if (editingId.value) {
      // Update existing task type
      const backendId = parseTaskTypeId(editingId.value)
      await clientTypeStore.updateClientType(backendId, {
        expectedTAT: parseFloat(formData.value.expectedTAT),
        price: parseFloat(formData.value.price),
        physicianPayout: parseFloat(formData.value.payout),
      })
    } else {
      // Create new task type
      await clientTypeStore.createClientType({
        clientId: parseInt(formData.value.clientId!),
        modality: formData.value.modality!,
        bodyArea: formData.value.bodyArea!,
        hasPriors: formData.value.hasPriors,
        expectedTAT: parseFloat(formData.value.expectedTAT),
        price: parseFloat(formData.value.price),
        physicianPayout: parseFloat(formData.value.payout),
      })
    }

    // Close dialog and refresh list
    isDialogOpen.value = false
    await clientTypeStore.fetchClientTypes()
  } catch (error: any) {
    formError.value = error?.message || 'Failed to save task type'
  } finally {
    saving.value = false
  }
}

// Handle dialog close
function handleDialogClose() {
  if (!saving.value) {
    isDialogOpen.value = false
    resetForm()
  }
}

// Handle delete click
function handleDeleteClick(taskType: TaskType) {
  taskTypeToDelete.value = taskType
  showDeleteConfirm.value = true
}

// Handle delete confirmation
async function handleDeleteConfirm() {
  if (!taskTypeToDelete.value) return

  deleting.value = true
  try {
    const backendId = parseTaskTypeId(taskTypeToDelete.value.id)
    await clientTypeStore.deleteClientType(backendId)

    // Close dialog and refresh list
    showDeleteConfirm.value = false
    taskTypeToDelete.value = null
    await clientTypeStore.fetchClientTypes()
  } catch (error) {
    console.error('Failed to delete task type:', error)
    // You could add a toast notification here
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await clientTypeStore.fetchClientTypes()
})
</script>
