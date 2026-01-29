<template>
  <div>
    <PageHeader
      :title="t('sla.title')"
      :subtitle="studyStore.loading ? t('common.loading') : t('sla.subtitle')"
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
        <h2 class="text-sm font-semibold">{{ t('sla.statusDistribution') }}</h2>
      </div>
      <div class="clinical-card-body">
        <div class="grid grid-cols-4 gap-4">
          <div v-for="item in statusCounts" :key="item.status" class="flex items-center justify-between p-3 bg-muted/50 rounded">
            <StatusBadge :status="item.status" />
            <span class="text-lg font-semibold">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Overdue Studies Table -->
    <div v-if="overdueStudies.length > 0" class="clinical-card mt-6">
      <div class="clinical-card-header bg-destructive/10">
        <h2 class="text-sm font-semibold text-destructive">{{ t('sla.overdueStudies') }}</h2>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('sla.headers.studyId') }}</th>
            <th>{{ t('sla.headers.client') }}</th>
            <th>{{ t('sla.headers.status') }}</th>
            <th>{{ t('sla.headers.assignedTo') }}</th>
            <th>{{ t('sla.headers.overdueBy') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="study in overdueStudies" :key="study.id">
            <td class="font-mono text-xs">{{ study.id }}</td>
            <td class="text-sm">{{ study.clientName }}</td>
            <td><StatusBadge :status="study.status" /></td>
            <td class="text-sm">{{ study.assignedPhysician || '-' }}</td>
            <td class="text-destructive font-medium">
              {{ getOverdueTime(study) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useStudyStore } from '@/stores/studyStore'
import type { Study } from '@/types/study'

const { t } = useI18n()
const studyStore = useStudyStore()
const now = new Date()

const activeStudies = computed(() =>
  studyStore.studies.filter(s => s.status !== 'delivered')
)

const overdueStudies = computed(() => {
  const currentTime = new Date()

  const overdue = studyStore.studies.filter(study => {
    // Must have deadline
    if (!study.deadline) return false

    // Must be past deadline
    const deadline = new Date(study.deadline)
    if (deadline >= currentTime) return false

    // Exclude only DELIVERED status
    return study.status !== 'delivered'
  })

  // Sort by most overdue first
  return overdue.sort((a, b) => {
    const aOverdue = currentTime.getTime() - new Date(a.deadline!).getTime()
    const bOverdue = currentTime.getTime() - new Date(b.deadline!).getTime()
    return bOverdue - aOverdue // Most overdue first
  })
})

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
  { label: t('sla.metrics.activeStudies'), value: activeStudies.value.length, color: "text-primary" },
  { label: t('sla.metrics.overdue'), value: overdueStudies.value.length, color: "text-destructive" },
  { label: t('sla.metrics.critical'), value: criticalStudies.value.length, color: "text-urgency-urgent" },
  { label: t('sla.metrics.warning'), value: warningStudies.value.length, color: "text-urgency-urgent" },
])

const statusCounts = computed(() => [
  { status: "new" as const, count: studyStore.studies.filter(s => s.status === 'new').length },
  { status: "assigned" as const, count: studyStore.studies.filter(s => s.status === 'assigned').length },
  { status: "in-progress" as const, count: studyStore.studies.filter(s => s.status === 'in-progress').length },
  { status: "draft-ready" as const, count: studyStore.studies.filter(s => s.status === 'draft-ready').length },
  { status: "under-validation" as const, count: studyStore.studies.filter(s => s.status === 'under-validation').length },
  { status: "returned" as const, count: studyStore.studies.filter(s => s.status === 'returned').length },
  { status: "finalized" as const, count: studyStore.studies.filter(s => s.status === 'finalized').length },
  { status: "delivered" as const, count: studyStore.studies.filter(s => s.status === 'delivered').length },
])

const getOverdueTime = (study: Study) => {
  const currentTime = new Date()
  const overdueMs = currentTime.getTime() - new Date(study.deadline).getTime()
  const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60))
  const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60))
  return overdueHours > 0 ? `${overdueHours}h ${overdueMins}m` : `${overdueMins}m`
}

onMounted(async () => {
  await studyStore.fetchStudies()
})
</script>
