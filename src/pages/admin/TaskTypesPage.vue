<template>
  <div>
    <PageHeader
      title="Task Types"
      subtitle="Configure pricing and TAT by client and modality"
    >
      <template #actions>
        <Button @click="handleNew">
          <Plus class="w-4 h-4 mr-2" />
          Add Task Type
        </Button>
      </template>
    </PageHeader>

    <div class="clinical-card overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Modality</th>
            <th>Body Area</th>
            <th>Priors</th>
            <th>Expected TAT</th>
            <th>Price</th>
            <th>Payout</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tt in mockTaskTypes" :key="tt.id">
            <td class="text-sm font-medium">{{ tt.client }}</td>
            <td class="text-sm">{{ tt.modality }}</td>
            <td class="text-sm">{{ tt.bodyArea }}</td>
            <td>
              <span :class="['status-badge', tt.hasPriors ? 'status-assigned' : 'status-new']">
                {{ tt.hasPriors ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="text-sm">{{ tt.expectedTAT }}h</td>
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
          <DialogTitle>{{ editingId ? 'Edit Task Type' : 'New Task Type' }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label>Client</Label>
            <Input placeholder="e.g., City General Hospital" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>Modality</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CT">CT</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="PET">PET</SelectItem>
                  <SelectItem value="NM">NM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label>Body Area</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Head">Head</SelectItem>
                  <SelectItem value="Neck">Neck</SelectItem>
                  <SelectItem value="Chest">Chest</SelectItem>
                  <SelectItem value="Abdomen">Abdomen</SelectItem>
                  <SelectItem value="Pelvis">Pelvis</SelectItem>
                  <SelectItem value="Spine">Spine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox />
            <Label class="text-sm font-normal">Includes prior studies</Label>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="grid gap-2">
              <Label>TAT (hours)</Label>
              <Input type="number" placeholder="4" />
            </div>
            <div class="grid gap-2">
              <Label>Price ($)</Label>
              <Input type="number" placeholder="150" />
            </div>
            <div class="grid gap-2">
              <Label>Payout ($)</Label>
              <Input type="number" placeholder="75" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">Cancel</Button>
          <Button @click="isDialogOpen = false">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Edit2, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/button.vue'
import { mockTaskTypes } from '@/data/mockData'
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
</script>
