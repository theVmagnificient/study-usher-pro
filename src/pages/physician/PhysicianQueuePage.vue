<template>
  <div>
    <PageHeader
      title="My Queue"
      :subtitle="`${pendingStudies.length} studies pending`"
    />

    <!-- Workload Warning -->
    <div v-if="activeCount >= maxActive" class="clinical-card p-4 mb-6 border-l-4 border-l-[hsl(var(--urgency-urgent))] bg-[hsl(var(--urgency-urgent)/0.15)]">
      <div class="flex items-center gap-3">
        <AlertCircle class="w-5 h-5 text-[hsl(var(--urgency-urgent))]" />
        <div>
          <p class="text-sm font-medium text-foreground">Maximum workload reached</p>
          <p class="text-xs text-muted-foreground">Complete a study before starting a new one</p>
        </div>
      </div>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="pending" class="gap-2">
          <Clock class="w-4 h-4" />
          To Report
          <span v-if="pendingStudies.length > 0" class="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
            {{ pendingStudies.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger value="commented" class="gap-2">
          <MessageCircle class="w-4 h-4" />
          Commented
          <span v-if="commentedStudies.length > 0" class="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {{ commentedStudies.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger value="completed" class="gap-2">
          <CheckCircle class="w-4 h-4" />
          Completed
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
              <UrgencyBadge :urgency="study.urgency" />
              <DeadlineTimer :deadline="study.deadline" />
              <span v-if="study.hasPriors" class="status-badge status-assigned">
                {{ study.priorCount }} prior{{ study.priorCount !== 1 ? 's' : '' }}
              </span>
              <span v-if="study.validatorComments && study.validatorComments.length > 0" class="flex items-center gap-1 text-amber-600">
                <MessageCircle class="w-4 h-4" />
              </span>
            </div>
          </div>

          <div v-if="pendingStudies.length === 0" class="clinical-card p-12 text-center">
            <FileText class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p class="text-lg font-medium text-foreground">No studies in queue</p>
            <p class="text-sm text-muted-foreground">New studies will appear here when assigned</p>
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
                  <span class="font-mono text-xs font-medium">{{ study.id }}</span>
                  <span class="text-xs px-2 py-0.5 rounded bg-status-finalized/20 text-status-finalized">
                    {{ study.status }}
                  </span>
                </div>
                <div class="text-sm text-muted-foreground flex items-center gap-2">
                  <LinkedBodyAreasDisplay :study="study" :all-studies="mockStudies" />
                  <span>• {{ study.patientId }}</span>
                </div>
                <div v-if="study.validatorComments && study.validatorComments.length > 0" class="mt-2 p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded border border-amber-500/30">
                  <p class="text-sm text-foreground line-clamp-2">{{ study.validatorComments[0].text }}</p>
                  <p class="text-xs text-muted-foreground mt-1">— {{ study.validatorComments[0].validatorName }}</p>
                  <p v-if="study.validatorComments.length > 1" class="text-xs text-amber-600 mt-1">+{{ study.validatorComments.length - 1 }} more comment{{ study.validatorComments.length > 2 ? 's' : '' }}</p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <span class="text-sm text-muted-foreground">
                {{ format(new Date(study.deadline), "MMM d, yyyy") }}
              </span>
            </div>
          </div>

          <div v-if="commentedStudies.length === 0" class="clinical-card p-12 text-center">
            <MessageCircle class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p class="text-lg font-medium text-foreground">No commented studies</p>
            <p class="text-sm text-muted-foreground">Validator feedback on your reports will appear here</p>
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
              <UrgencyBadge :urgency="study.urgency" />
              <span class="text-sm text-muted-foreground">
                {{ format(new Date(study.deadline), "MMM d, yyyy") }}
              </span>
            </div>
          </div>

          <div v-if="completedStudies.length === 0" class="clinical-card p-12 text-center">
            <CheckCircle class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p class="text-lg font-medium text-foreground">No completed studies</p>
            <p class="text-sm text-muted-foreground">Finalized reports will appear here</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, AlertCircle, CheckCircle, Clock, MessageCircle } from 'lucide-vue-next'
import { format } from 'date-fns'
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
const activeTab = ref('pending')

const pendingStudies = computed(() =>
  mockStudies.filter(s =>
    ['assigned', 'in-progress', 'returned'].includes(s.status)
  ).sort((a, b) =>
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )
)

const completedStudies = computed(() =>
  mockStudies.filter(s =>
    ['finalized', 'delivered'].includes(s.status)
  ).sort((a, b) =>
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  )
)

const commentedStudies = computed(() =>
  mockStudies.filter(s =>
    s.validatorComments && s.validatorComments.length > 0 && ['finalized', 'delivered'].includes(s.status)
  ).sort((a, b) =>
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  )
)

const activeCount = computed(() =>
  pendingStudies.value.filter(s => s.status === 'in-progress').length
)
const maxActive = 2

const handleStudyClick = (studyId: string) => {
  router.push(`/report/${studyId}`)
}
</script>
