<template>
  <div>
    <PageHeader
      title="Validation Queue"
      :subtitle="`${allValidationStudies.length} studies awaiting validation`"
    />

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="urgent" class="gap-2">
          <AlertTriangle class="w-4 h-4" />
          Urgent Queue
          <span v-if="(urgentPending.length + urgentInProgress.length) > 0" class="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
            {{ urgentPending.length + urgentInProgress.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger value="retrospective" class="gap-2">
          <Clock class="w-4 h-4" />
          Retrospective Queue
          <span v-if="(retroPending.length + retroInProgress.length) > 0" class="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
            {{ retroPending.length + retroInProgress.length }}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="urgent">
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p class="text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            Studies requiring review within 1 hour — prioritize speed while maintaining accuracy
          </p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <Loader2 class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold">In Progress</h3>
            <span class="text-xs text-muted-foreground">({{ urgentInProgress.length }})</span>
          </div>
          <div v-if="urgentInProgress.length > 0" class="space-y-2">
            <div
              v-for="study in urgentInProgress"
              :key="study.id"
              @click="handleStudyClick(study.id)"
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
                    <span class="font-mono text-xs font-medium">{{ study.id }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
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
                <DeadlineTimer :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">No urgent validations in progress</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <FileCheck class="w-4 h-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold">To Validate</h3>
            <span class="text-xs text-muted-foreground">({{ urgentPending.length }})</span>
          </div>
          <div v-if="urgentPending.length > 0" class="space-y-2">
            <div
              v-for="study in urgentPending"
              :key="study.id"
              @click="handleStudyClick(study.id)"
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
                    <span class="font-mono text-xs font-medium">{{ study.id }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
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
                <DeadlineTimer :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">No urgent studies pending validation</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <CheckCircle class="w-4 h-4 text-status-finalized" />
            <h3 class="text-sm font-semibold">Completed</h3>
            <span class="text-xs text-muted-foreground">({{ urgentCompleted.length }})</span>
          </div>
          <div v-if="urgentCompleted.length > 0" class="space-y-2">
            <div
              v-for="study in urgentCompleted"
              :key="study.id"
              @click="handleStudyClick(study.id)"
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
                    <span class="font-mono text-xs font-medium">{{ study.id }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
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
                <span class="text-sm text-muted-foreground">
                  {{ format(new Date(study.deadline), "MMM d, yyyy") }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">No urgent validations completed yet</p>
        </div>
      </TabsContent>

      <TabsContent value="retrospective">
        <div class="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p class="text-sm text-primary font-medium flex items-center gap-2">
            <Clock class="w-4 h-4" />
            Focus on detailed analysis and accuracy — take time to ensure thorough review
          </p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <Loader2 class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold">In Progress</h3>
            <span class="text-xs text-muted-foreground">({{ retroInProgress.length }})</span>
          </div>
          <div v-if="retroInProgress.length > 0" class="space-y-2">
            <div
              v-for="study in retroInProgress"
              :key="study.id"
              @click="handleStudyClick(study.id)"
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
                    <span class="font-mono text-xs font-medium">{{ study.id }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
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
                <DeadlineTimer :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">No retrospective validations in progress</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <FileCheck class="w-4 h-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold">To Validate</h3>
            <span class="text-xs text-muted-foreground">({{ retroPending.length }})</span>
          </div>
          <div v-if="retroPending.length > 0" class="space-y-2">
            <div
              v-for="study in retroPending"
              :key="study.id"
              @click="handleStudyClick(study.id)"
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
                    <span class="font-mono text-xs font-medium">{{ study.id }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
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
                <DeadlineTimer :deadline="study.deadline" />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">No retrospective studies pending validation</p>
        </div>
        
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <CheckCircle class="w-4 h-4 text-status-finalized" />
            <h3 class="text-sm font-semibold">Completed</h3>
            <span class="text-xs text-muted-foreground">({{ retroCompleted.length }})</span>
          </div>
          <div v-if="retroCompleted.length > 0" class="space-y-2">
            <div
              v-for="study in retroCompleted"
              :key="study.id"
              @click="handleStudyClick(study.id)"
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
                    <span class="font-mono text-xs font-medium">{{ study.id }}</span>
                    <StatusBadge :status="study.status" />
                  </div>
                  <div class="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
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
                <span class="text-sm text-muted-foreground">
                  {{ format(new Date(study.deadline), "MMM d, yyyy") }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground italic pl-6">No retrospective validations completed yet</p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileCheck, User, AlertTriangle, Clock, CheckCircle, Loader2 } from 'lucide-vue-next'
import { differenceInHours, format } from 'date-fns'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import LinkedBodyAreasDisplay from '@/components/ui/LinkedBodyAreasDisplay.vue'
import { mockStudies } from '@/data/mockData'
import { cn } from '@/lib/utils'
import Tabs from '@/components/ui/tabs.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import TabsContent from '@/components/ui/TabsContent.vue'

const router = useRouter()
const activeTab = ref('urgent')

const pendingValidation = computed(() =>
  mockStudies.filter(s => ['draft-ready'].includes(s.status))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
)

const inProgressValidation = computed(() =>
  mockStudies.filter(s => ['under-validation'].includes(s.status))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
)

const completedValidation = computed(() =>
  mockStudies.filter(s => ['finalized', 'delivered'].includes(s.status))
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
)

const allValidationStudies = computed(() => [...pendingValidation.value, ...inProgressValidation.value])

const now = new Date()

const isUrgent = (s: typeof mockStudies[0]) => {
  const hoursUntilDeadline = differenceInHours(new Date(s.deadline), now)
  return hoursUntilDeadline < 1 || s.urgency === 'stat'
}

const urgentPending = computed(() => pendingValidation.value.filter(isUrgent))
const urgentInProgress = computed(() => inProgressValidation.value.filter(isUrgent))
const urgentCompleted = computed(() => completedValidation.value.filter(isUrgent))

const retroPending = computed(() => pendingValidation.value.filter(s => !isUrgent(s)))
const retroInProgress = computed(() => inProgressValidation.value.filter(s => !isUrgent(s)))
const retroCompleted = computed(() => completedValidation.value.filter(s => !isUrgent(s)))

const handleStudyClick = (studyId: string) => {
  router.push(`/report/${studyId}`)
}
</script>
