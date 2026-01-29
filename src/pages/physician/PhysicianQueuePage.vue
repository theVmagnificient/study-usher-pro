<template>
  <div>
    <PageHeader
      :title="t('queue.title')"
      :subtitle="taskStore.loading ? t('common.loading') : t('queue.subtitle', { count: pendingStudies.length })"
    />

    <!-- Loading State -->
    <div v-if="taskStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="taskStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ taskStore.error }}
    </div>

    <!-- Content -->
    <div v-else>
    <!-- Workload Warning -->
    <div v-if="activeCount >= maxActive" class="clinical-card p-4 mb-6 border-l-4 border-l-[hsl(var(--urgency-urgent))] bg-[hsl(var(--urgency-urgent)/0.15)]">
      <div class="flex items-center gap-3">
        <AlertCircle class="w-5 h-5 text-[hsl(var(--urgency-urgent))]" />
        <div>
          <p class="text-sm font-medium text-foreground">{{ t('queue.maxWorkload') }}</p>
          <p class="text-xs text-muted-foreground">{{ t('queue.completeFirst') }}</p>
        </div>
      </div>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="pending" class="gap-2">
          <Clock class="w-4 h-4" />
          {{ t('queue.tabs.toReport') }}
          <span v-if="pendingStudies.length > 0" class="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
            {{ pendingStudies.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger value="commented" class="gap-2">
          <MessageCircle class="w-4 h-4" />
          {{ t('queue.tabs.commented') }}
          <span v-if="commentedCount > 0" class="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {{ commentedCount }}
          </span>
        </TabsTrigger>
        <TabsTrigger value="completed" class="gap-2">
          <CheckCircle class="w-4 h-4" />
          {{ t('queue.tabs.completed') }}
          <span v-if="completedStudies.length > 0" class="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
            {{ completedStudies.length }}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <div class="space-y-3">
          <div
            v-for="study in pendingStudies"
            :key="study.id"
            @click="handleStudyClick(study.id)"
            :class="cn(
              'queue-item',
              study.urgency === 'stat' && study.status !== 'finalized' && study.status !== 'delivered' && 'queue-item-urgent'
            )"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <FileText class="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                  <StatusBadge :status="study.status" />
                </div>
                <div class="text-sm text-muted-foreground flex items-center gap-2">
                  <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myReportingTasks" />
                  <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <UrgencyBadge :urgency="study.urgency" />
              <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
              <span v-if="study.hasPriors" class="status-badge status-assigned">
                {{ t('queue.priors', { count: study.priorCount }) }}
              </span>
              <span v-if="study.validatorComments && study.validatorComments.length > 0" class="flex items-center gap-1 text-amber-600">
                <MessageCircle class="w-4 h-4" />
              </span>
            </div>
          </div>

          <div v-if="pendingStudies.length === 0" class="clinical-card p-12 text-center">
            <FileText class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p class="text-lg font-medium text-foreground">{{ t('queue.empty.noTasks') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('queue.empty.noTasksDesc') }}</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="commented">
        <div class="space-y-3">
          <div
            v-for="study in commentedStudies"
            :key="study.id"
            @click="handleStudyClick(study.id)"
            class="queue-item"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded bg-amber-100 flex items-center justify-center">
                <MessageCircle class="w-5 h-5 text-amber-600" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                  <span class="text-xs px-2 py-0.5 rounded bg-status-finalized/20 text-status-finalized">
                    {{ study.status }}
                  </span>
                </div>
                <div class="text-sm text-muted-foreground flex items-center gap-2">
                  <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myReportingTasks" />
                  <span>• {{ study.patientId }}</span>
                </div>
                <div v-if="study.validatorComments && study.validatorComments.length > 0" class="mt-2 p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded border border-amber-500/30">
                  <p class="text-sm text-foreground line-clamp-2">{{ study.validatorComments[0].text }}</p>
                  <p class="text-xs text-muted-foreground mt-1">— {{ study.validatorComments[0].validatorName }}</p>
                  <p v-if="study.validatorComments.length > 1" class="text-xs text-amber-600 mt-1">+{{ t('queue.moreComments', { count: study.validatorComments.length - 1 }) }}</p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
            </div>
          </div>

          <div v-if="commentedStudies.length === 0" class="clinical-card p-12 text-center">
            <MessageCircle class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p class="text-lg font-medium text-foreground">{{ t('queue.empty.noCommented') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('queue.empty.noCommentedDesc') }}</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="completed">
        <div class="space-y-3">
          <div
            v-for="study in completedStudies"
            :key="study.id"
            @click="handleStudyClick(study.id)"
            :class="cn(
              'queue-item',
              study.urgency === 'stat' && study.status !== 'finalized' && study.status !== 'delivered' && 'queue-item-urgent'
            )"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <FileText class="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                  <StatusBadge :status="study.status" />
                </div>
                <div class="text-sm text-muted-foreground flex items-center gap-2">
                  <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myReportingTasks" />
                  <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <UrgencyBadge :urgency="study.urgency" />
              <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
            </div>
          </div>

          <div v-if="completedStudies.length === 0" class="clinical-card p-12 text-center">
            <CheckCircle class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p class="text-lg font-medium text-foreground">{{ t('queue.empty.noCompleted') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('queue.empty.noCompletedDesc') }}</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { FileText, AlertCircle, CheckCircle, Clock, MessageCircle } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import LinkedBodyAreasDisplay from '@/components/ui/LinkedBodyAreasDisplay.vue'
import { useTaskStore } from '@/stores/taskStore'
import { cn } from '@/lib/utils'
import Tabs from '@/components/ui/tabs.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import TabsContent from '@/components/ui/TabsContent.vue'

const router = useRouter()
const { t } = useI18n()
const taskStore = useTaskStore()
const activeTab = ref('pending')

const pendingStudies = computed(() =>
  taskStore.myReportingTasks.filter(task => {
    // "На описание" - tasks BEFORE sending to validation
    // Include: new, assigned, in-progress, draft-ready, returned (returned-for-revision)
    // Exclude: translated (ready for validation), assigned-for-validation and beyond (they go to "Завершенные")
    const pendingStatuses = ['new', 'assigned', 'in-progress', 'draft-ready', 'returned']
    return pendingStatuses.includes(task.status)
  }).sort((a, b) =>
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )
)

const completedStudies = computed(() =>
  taskStore.myReportingTasks.filter(s => {
    // "Завершенные" - tasks AFTER sending to validation
    // Include: assigned-for-validation, under-validation, finalized, delivered
    const completedStatuses = ['assigned-for-validation', 'under-validation', 'finalized', 'delivered']
    return completedStatuses.includes(s.status)
  }).sort((a, b) =>
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  )
)

const commentedStudies = computed(() =>
  taskStore.myReportingTasks.filter(s => {
    // "С комментариями" - tasks with validator comments
    // Always show: 'returned' (returned-for-revision) - critical comments
    // Also show: 'finalized' or 'delivered' with validator comments (non-critical edits)
    if (s.status === 'returned') {
      return true // Always show returned tasks (critical comments)
    }

    // For finalized/delivered, check if there are ANY validator comments
    if (['finalized', 'delivered'].includes(s.status)) {
      return (s.validatorCommentsCount && s.validatorCommentsCount > 0)
    }

    return false
  }).sort((a, b) =>
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  )
)

const commentedCount = computed(() => commentedStudies.value.length)

const activeCount = computed(() =>
  pendingStudies.value.filter(s => s.status === 'in-progress').length
)
const maxActive = 2

const handleStudyClick = (taskId: number) => {
  router.push(`/report/${taskId}`)
}

onMounted(async () => {
  await taskStore.fetchMyReportingTasks()
})
</script>
