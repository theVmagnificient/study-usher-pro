<template>
  <div>
    <PageHeader
      title="SLA / TAT Dashboard"
      subtitle="Real-time turnaround time monitoring"
    />

    <!-- Key Metrics -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div v-for="stat in stats" :key="stat.label" class="clinical-card p-4">
        <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
        <p :class="['text-3xl font-semibold mt-1', stat.color]">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Status Distribution -->
    <div class="clinical-card">
      <div class="clinical-card-header">
        <h2 class="text-sm font-semibold">Status Distribution</h2>
      </div>
      <div class="clinical-card-body">
        <div class="grid grid-cols-4 gap-4">
          <div v-for="item in statusCounts" :key="item.status" class="flex items-center justify-between p-3 bg-muted/50 rounded">
            <span :class="['status-badge', item.className]">{{ item.status }}</span>
            <span class="text-lg font-semibold">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Overdue Studies Table -->
    <div v-if="overdueStudies.length > 0" class="clinical-card mt-6">
      <div class="clinical-card-header bg-destructive/10">
        <h2 class="text-sm font-semibold text-destructive">Overdue Studies</h2>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Study ID</th>
            <th>Client</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Overdue By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="study in overdueStudies" :key="study.id">
            <td class="font-mono text-xs">{{ study.id }}</td>
            <td class="text-sm">{{ study.clientName }}</td>
            <td><span :class="['status-badge', `status-${study.status}`]">{{ study.status }}</span></td>
            <td class="text-sm">{{ study.assignedPhysician || '-' }}</td>
            <td class="text-destructive font-medium">
              {{ getOverdueTime(study) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { mockStudies } from '@/data/mockData'

const now = new Date()

const activeStudies = computed(() => 
  mockStudies.filter(s => !['finalized', 'delivered'].includes(s.status))
)

const overdueStudies = computed(() => 
  activeStudies.value.filter(s => new Date(s.deadline) < now)
)

const criticalStudies = computed(() => 
  activeStudies.value.filter(s => {
    const deadline = new Date(s.deadline)
    const diff = deadline.getTime() - now.getTime()
    return diff > 0 && diff < 60 * 60 * 1000
  })
)

const warningStudies = computed(() => 
  activeStudies.value.filter(s => {
    const deadline = new Date(s.deadline)
    const diff = deadline.getTime() - now.getTime()
    return diff >= 60 * 60 * 1000 && diff < 4 * 60 * 60 * 1000
  })
)

const stats = computed(() => [
  { label: "Active Studies", value: activeStudies.value.length, color: "text-primary" },
  { label: "Overdue", value: overdueStudies.value.length, color: "text-destructive" },
  { label: "Critical (<1h)", value: criticalStudies.value.length, color: "text-urgency-urgent" },
  { label: "Warning (<4h)", value: warningStudies.value.length, color: "text-urgency-urgent" },
])

const statusCounts = computed(() => [
  { status: "New", count: mockStudies.filter(s => s.status === 'new').length, className: "status-new" },
  { status: "Assigned", count: mockStudies.filter(s => s.status === 'assigned').length, className: "status-assigned" },
  { status: "In Progress", count: mockStudies.filter(s => s.status === 'in-progress').length, className: "status-in-progress" },
  { status: "Draft Ready", count: mockStudies.filter(s => s.status === 'draft-ready').length, className: "status-draft-ready" },
  { status: "Under Validation", count: mockStudies.filter(s => s.status === 'under-validation').length, className: "status-under-validation" },
  { status: "Returned", count: mockStudies.filter(s => s.status === 'returned').length, className: "status-returned" },
  { status: "Finalized", count: mockStudies.filter(s => s.status === 'finalized').length, className: "status-finalized" },
  { status: "Delivered", count: mockStudies.filter(s => s.status === 'delivered').length, className: "status-delivered" },
])

const getOverdueTime = (study: typeof mockStudies[0]) => {
  const overdueMs = now.getTime() - new Date(study.deadline).getTime()
  const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60))
  const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60))
  return overdueHours > 0 ? `${overdueHours}h ${overdueMins}m` : `${overdueMins}m`
}
</script>
