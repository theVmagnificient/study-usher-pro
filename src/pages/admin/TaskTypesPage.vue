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
                <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? t('taskTypes.dialog.titleEdit') : t('taskTypes.dialog.titleNew') }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label>{{ t('taskTypes.dialog.client') }}</Label>
            <Input :placeholder="t('taskTypes.dialog.clientPlaceholder')" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.modality') }}</Label>
              <Select>
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
              <Select>
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
          <div class="flex items-center gap-2">
            <Checkbox />
            <Label class="text-sm font-normal">{{ t('taskTypes.dialog.includesPriors') }}</Label>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.tat') }}</Label>
              <Input type="number" placeholder="4" />
            </div>
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.price') }}</Label>
              <Input type="number" placeholder="150" />
            </div>
            <div class="grid gap-2">
              <Label>{{ t('taskTypes.dialog.payout') }}</Label>
              <Input type="number" placeholder="75" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">{{ t('common.cancel') }}</Button>
          <Button @click="isDialogOpen = false">{{ t('common.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const { t } = useI18n()
const clientTypeStore = useClientTypeStore()

const isDialogOpen = ref(false)
const editingId = ref<string | null>(null)

const handleEdit = (id: string) => {
  editingId.value = id
  isDialogOpen.value = true
}

const handleNew = () => {
  editingId.value = null
  isDialogOpen.value = true
}

onMounted(async () => {
  await clientTypeStore.fetchClientTypes()
})
</script>
