<template>
  <div>
    <PageHeader
      :title="t('validation.title')"
      :subtitle="taskStore.loading ? t('common.loading') : t('validation.subtitle', { count: allValidationStudies.length })"
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
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="urgent" class="gap-2">
          <AlertTriangle class="w-4 h-4" />
          {{ t('validation.tabs.urgent') }}
          <span v-if="(urgentPending.length + urgentInProgress.length) > 0" class="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
            {{ urgentPending.length + urgentInProgress.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger value="retrospective" class="gap-2">
          <Clock class="w-4 h-4" />
          {{ t('validation.tabs.retrospective') }}
          <span v-if="(retroPending.length + retroInProgress.length) > 0" class="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
            {{ retroPending.length + retroInProgress.length }}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="urgent">
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p class="text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            {{ t('validation.urgentAlert') }}
          </p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <Loader2 class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold">{{ t('validation.sections.inProgress') }}</h3>
            <span class="text-xs text-muted-foreground">({{ urgentInProgress.length }})</span>
          </div>
          <div v-if="urgentInProgress.length > 0" class="space-y-2">
            <div
              v-for="study in urgentInProgress"
              :key="study.id"
              @click="handleStudyClick(study.taskId)"
              :class="cn(
                'queue-item',
                study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && 'queue-item-urgent'
              )"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <FileCheck class="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myValidationTasks" />
                    <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <User class="w-4 h-4" />
                  {{ study.assignedPhysician }}
                </div>
                <UrgencyBadge :urgency="study.urgency" />
                <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">{{ t('validation.empty.urgentInProgress') }}</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <FileCheck class="w-4 h-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold">{{ t('validation.sections.toValidate') }}</h3>
            <span class="text-xs text-muted-foreground">({{ urgentPending.length }})</span>
          </div>
          <div v-if="urgentPending.length > 0" class="space-y-2">
            <div
              v-for="study in urgentPending"
              :key="study.id"
              @click="handleStudyClick(study.taskId)"
              :class="cn(
                'queue-item',
                study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && 'queue-item-urgent'
              )"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <FileCheck class="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myValidationTasks" />
                    <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <User class="w-4 h-4" />
                  {{ study.assignedPhysician }}
                </div>
                <UrgencyBadge :urgency="study.urgency" />
                <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">{{ t('validation.empty.urgentToValidate') }}</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <CheckCircle class="w-4 h-4 text-status-finalized" />
            <h3 class="text-sm font-semibold">{{ t('validation.sections.completed') }}</h3>
            <span class="text-xs text-muted-foreground">({{ urgentCompleted.length }})</span>
          </div>
          <div v-if="urgentCompleted.length > 0" class="space-y-2">
            <div
              v-for="study in urgentCompleted"
              :key="study.id"
              @click="handleStudyClick(study.taskId)"
              :class="cn(
                'queue-item',
                study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && 'queue-item-urgent'
              )"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <FileCheck class="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myValidationTasks" />
                    <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <User class="w-4 h-4" />
                  {{ study.assignedPhysician }}
                </div>
                <UrgencyBadge :urgency="study.urgency" />
                <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">{{ t('validation.empty.urgentCompleted') }}</p>
        </div>
      </TabsContent>

      <TabsContent value="retrospective">
        <div class="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p class="text-sm text-primary font-medium flex items-center gap-2">
            <Clock class="w-4 h-4" />
            {{ t('validation.retroAlert') }}
          </p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <Loader2 class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold">{{ t('validation.sections.inProgress') }}</h3>
            <span class="text-xs text-muted-foreground">({{ retroInProgress.length }})</span>
          </div>
          <div v-if="retroInProgress.length > 0" class="space-y-2">
            <div
              v-for="study in retroInProgress"
              :key="study.id"
              @click="handleStudyClick(study.taskId)"
              :class="cn(
                'queue-item',
                study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && 'queue-item-urgent'
              )"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <FileCheck class="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myValidationTasks" />
                    <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <User class="w-4 h-4" />
                  {{ study.assignedPhysician }}
                </div>
                <UrgencyBadge :urgency="study.urgency" />
                <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">{{ t('validation.empty.retroInProgress') }}</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <FileCheck class="w-4 h-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold">{{ t('validation.sections.toValidate') }}</h3>
            <span class="text-xs text-muted-foreground">({{ retroPending.length }})</span>
          </div>
          <div v-if="retroPending.length > 0" class="space-y-2">
            <div
              v-for="study in retroPending"
              :key="study.id"
              @click="handleStudyClick(study.taskId)"
              :class="cn(
                'queue-item',
                study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && 'queue-item-urgent'
              )"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <FileCheck class="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myValidationTasks" />
                    <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <User class="w-4 h-4" />
                  {{ study.assignedPhysician }}
                </div>
                <UrgencyBadge :urgency="study.urgency" />
                <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">{{ t('validation.empty.retroToValidate') }}</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <CheckCircle class="w-4 h-4 text-status-finalized" />
            <h3 class="text-sm font-semibold">{{ t('validation.sections.completed') }}</h3>
            <span class="text-xs text-muted-foreground">({{ retroCompleted.length }})</span>
          </div>
          <div v-if="retroCompleted.length > 0" class="space-y-2">
            <div
              v-for="study in retroCompleted"
              :key="study.id"
              @click="handleStudyClick(study.taskId)"
              :class="cn(
                'queue-item',
                study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && 'queue-item-urgent'
              )"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <FileCheck class="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-medium">{{ study.accessionNumber }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="taskStore.myValidationTasks" />
                    <span>• {{ study.patientId }} ({{ study.sex }}/{{ study.age }}y)</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <User class="w-4 h-4" />
                  {{ study.assignedPhysician }}
                </div>
                <UrgencyBadge :urgency="study.urgency" />
                <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">{{ t('validation.empty.retroCompleted') }}</p>
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
import { FileCheck, User, AlertTriangle, Clock, CheckCircle, Loader2 } from 'lucide-vue-next'
import { differenceInHours } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import LinkedBodyAreasDisplay from '@/components/ui/LinkedBodyAreasDisplay.vue'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import type { Study } from '@/types/study'
import { cn } from '@/lib/utils'
import Tabs from '@/components/ui/tabs.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import TabsContent from '@/components/ui/TabsContent.vue'

const router = useRouter()
const { t } = useI18n()
const taskStore = useTaskStore()
const authStore = useAuthStore()
const activeTab = ref('urgent')

const pendingValidation = computed(() =>
  taskStore.myValidationTasks.filter(s => ['assigned-for-validation'].includes(s.status))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
)

const inProgressValidation = computed(() =>
  taskStore.myValidationTasks.filter(s => ['under-validation'].includes(s.status))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
)

const completedValidation = computed(() =>
  taskStore.myValidationTasks.filter(s => ['finalized', 'delivered'].includes(s.status))
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
)

const allValidationStudies = computed(() => [...pendingValidation.value, ...inProgressValidation.value])

const now = new Date()

const isUrgent = (s: Study) => {
  const hoursUntilDeadline = differenceInHours(new Date(s.deadline), now)
  return hoursUntilDeadline < 1 || s.urgency === 'stat' || s.urgency === 'urgent'
}

const urgentPending = computed(() => pendingValidation.value.filter(isUrgent))
const urgentInProgress = computed(() => inProgressValidation.value.filter(isUrgent))
const urgentCompleted = computed(() => completedValidation.value.filter(isUrgent))

const retroPending = computed(() => pendingValidation.value.filter(s => !isUrgent(s)))
const retroInProgress = computed(() => inProgressValidation.value.filter(s => !isUrgent(s)))
const retroCompleted = computed(() => completedValidation.value.filter(s => !isUrgent(s)))

const handleStudyClick = (taskId: number) => {
  router.push(`/report/${taskId}`)
}

onMounted(async () => {
  // Admins see all validation tasks, validators see only their own
  if (authStore.role === 'admin') {
    await taskStore.fetchAdminValidationTasks()
  } else {
    await taskStore.fetchMyValidationTasks()
  }
})
</script>
