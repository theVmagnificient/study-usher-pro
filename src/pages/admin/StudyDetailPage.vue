<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" @click="router.back()">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold">{{ study.id }}</h1>
          <StatusBadge :status="study.status" />
          <UrgencyBadge :urgency="study.urgency" />
        </div>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ study.clientName }} • {{ study.modality }} {{ study.bodyArea }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <DeadlineTimer :deadline="study.deadline" />
        <Button variant="outline">
          <Download class="w-4 h-4 mr-2" />
          DICOM
        </Button>
        <Button variant="outline">
          <UserPlus class="w-4 h-4 mr-2" />
          Reassign
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <!-- Main Info -->
      <div class="col-span-2 space-y-6">
        <!-- Patient & Study Info -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">Study Information</h3>
          </div>
          <div class="clinical-card-body">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="section-header">Patient ID</label>
                <p class="text-sm font-mono">{{ study.patientId }}</p>
              </div>
              <div>
                <label class="section-header">Sex / Age</label>
                <p class="text-sm">{{ study.sex }} / {{ study.age }} years</p>
              </div>
              <div>
                <label class="section-header">Received</label>
                <p class="text-sm">{{ format(new Date(study.receivedAt), "MMM dd, yyyy HH:mm") }}</p>
              </div>
              <div>
                <label class="section-header">Modality</label>
                <p class="text-sm">{{ study.modality }}</p>
              </div>
              <div>
                <label class="section-header">Body Area</label>
                <p class="text-sm">{{ study.bodyArea }}</p>
              </div>
              <div>
                <label class="section-header">Assigned To</label>
                <p class="text-sm">{{ study.assignedPhysician || 'Unassigned' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Report -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">Current Report</h3>
          </div>
          <div class="clinical-card-body space-y-4">
            <div>
              <label class="section-header">Protocol</label>
              <p class="text-sm text-muted-foreground">
                Non-contrast CT of the chest was performed using standard departmental protocol.
              </p>
            </div>
            <div>
              <label class="section-header">Findings</label>
              <p class="text-sm text-muted-foreground italic">No findings documented yet</p>
            </div>
            <div>
              <label class="section-header">Impression</label>
              <p class="text-sm text-muted-foreground italic">No impression documented yet</p>
            </div>
          </div>
        </div>

        <!-- Prior Studies -->
        <div v-if="study.hasPriors" class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">Prior Studies</h3>
            <span class="text-xs text-muted-foreground">{{ study.priorCount }} available</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prior in mockPriorStudies" :key="prior.id">
                <td class="text-sm font-medium">{{ prior.type }}</td>
                <td class="text-sm text-muted-foreground">{{ prior.date }}</td>
                <td class="flex items-center gap-2 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    @click="selectedPrior = prior"
                  >
                    <FileText class="w-4 h-4 mr-2" />
                    Report
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download class="w-4 h-4 mr-2" />
                    DICOM
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Column -->
      <div class="col-span-1 space-y-6">
        <!-- Linked Body Parts -->
        <div v-if="linkedStudies.length > 0" class="clinical-card border-primary/30 bg-primary/5">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Link2 class="w-4 h-4 text-primary" />
              Linked Body Parts
            </h3>
            <span class="text-xs text-muted-foreground">{{ linkedStudies.length + 1 }} zones</span>
          </div>
          <div class="divide-y divide-border">
            <!-- Current study -->
            <div class="p-3 bg-primary/10">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ study.bodyArea }}</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ study.id }}</p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">Current</span>
              </div>
            </div>
            <!-- Linked studies -->
            <button
              v-for="linked in linkedStudies"
              :key="linked.id"
              @click="router.push(`/study/${linked.id}`)"
              class="w-full p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ linked.bodyArea }}</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ linked.id }}</p>
                </div>
                <span :class="cn(
                  'text-xs px-2 py-0.5 rounded font-medium',
                  linked.status === 'finalized' || linked.status === 'delivered' 
                    ? 'bg-status-finalized/20 text-status-finalized'
                    : 'bg-muted text-muted-foreground'
                )">
                  {{ linked.status.replace('-', ' ') }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Audit History -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <History class="w-4 h-4" />
              History
            </h3>
          </div>
          <div class="divide-y divide-border max-h-[500px] overflow-y-auto scrollbar-thin">
            <div v-if="studyAuditLog.length > 0">
              <div v-for="entry in studyAuditLog" :key="entry.id" class="p-3">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-sm font-medium">{{ entry.action }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ format(new Date(entry.timestamp), "HH:mm") }}
                  </p>
                </div>
                <p class="text-xs text-muted-foreground">{{ entry.user }}</p>
                <div v-if="entry.previousStatus && entry.newStatus" class="flex items-center gap-1 mt-2">
                  <StatusBadge :status="entry.previousStatus" />
                  <span class="text-muted-foreground text-xs">→</span>
                  <StatusBadge :status="entry.newStatus" />
                </div>
                <p v-if="entry.comment" class="text-xs text-muted-foreground mt-2 italic">"{{ entry.comment }}"</p>
              </div>
            </div>
            <div v-else class="p-4 text-sm text-muted-foreground text-center">
              No history available
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Prior Report Dialog -->
    <Dialog :open="!!selectedPrior" @update:open="selectedPrior = null">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <FileText class="w-5 h-5" />
            Prior Report - {{ selectedPrior?.type }}
          </DialogTitle>
          <p class="text-sm text-muted-foreground">{{ selectedPrior?.date }}</p>
        </DialogHeader>
        <div class="space-y-4 mt-4">
          <div>
            <label class="section-header">Findings</label>
            <div class="mt-2 p-4 bg-muted/50 rounded-lg">
              <p class="text-sm whitespace-pre-wrap">
                {{ selectedPrior?.reportText || "No report text available" }}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download, UserPlus, History, Link2, FileText } from 'lucide-vue-next'
import Button from '@/components/ui/button.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import { getLinkedStudies } from '@/utils/linkedStudies'
import { mockStudies, mockPriorStudies, mockAuditLog } from '@/data/mockData'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import type { PriorStudy } from '@/types/study'

const route = useRoute()
const router = useRouter()

const selectedPrior = ref<PriorStudy | null>(null)

const study = computed(() => 
  mockStudies.find(s => s.id === route.params.studyId) || mockStudies[0]
)

const linkedStudies = computed(() => 
  getLinkedStudies(study.value, mockStudies)
)

const studyAuditLog = computed(() => 
  mockAuditLog.filter(l => l.studyId === study.value.id)
)
</script>
