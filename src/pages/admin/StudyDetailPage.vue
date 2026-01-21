<template>
  <div>
    <!-- Loading State -->
    <div v-if="studyStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="studyStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ studyStore.error }}
    </div>

    <!-- Content -->
    <div v-else-if="study">
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
          {{ t('studyDetail.dicom') }}
        </Button>
        <Button variant="outline" @click="showReassignDialog = true">
          <UserPlus class="w-4 h-4 mr-2" />
          {{ t('studyList.reassign') }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <!-- Main Info -->
      <div class="col-span-2 space-y-6">
        <!-- Patient & Study Info -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('studyDetail.studyInformation') }}</h3>
          </div>
          <div class="clinical-card-body">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="section-header">{{ t('studyDetail.patientId') }}</label>
                <p class="text-sm font-mono">{{ study.patientId }}</p>
              </div>
              <div>
                <label class="section-header">{{ t('studyDetail.sexAge') }}</label>
                <p class="text-sm">{{ study.sex }} / {{ study.age }} years</p>
              </div>
              <div>
                <label class="section-header">{{ t('studyDetail.received') }}</label>
                <p class="text-sm">{{ format(new Date(study.receivedAt), "MMM dd, yyyy HH:mm") }}</p>
              </div>
              <div>
                <label class="section-header">{{ t('studyDetail.modality') }}</label>
                <p class="text-sm">{{ study.modality }}</p>
              </div>
              <div>
                <label class="section-header">{{ t('studyDetail.bodyArea') }}</label>
                <p class="text-sm">{{ study.bodyArea }}</p>
              </div>
              <div>
                <label class="section-header">{{ t('studyDetail.assignedTo') }}</label>
                <p class="text-sm">{{ study.assignedPhysician || t('common.unassigned') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Report -->
        <div class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('studyDetail.currentReport') }}</h3>
          </div>
          <div class="clinical-card-body space-y-4">
            <!-- Protocol Section -->
            <div v-if="study.report?.protocol || study.report?.protocolEn">
              <label class="section-header">{{ t('studyDetail.protocol') }}</label>
              <div class="mt-2 grid gap-4" :class="study.report.protocol && study.report.protocolEn ? 'grid-cols-2' : 'grid-cols-1'">
                <div v-if="study.report.protocol" class="p-3 bg-muted/50 rounded-lg">
                  <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.russian') }}</p>
                  <p class="text-sm whitespace-pre-wrap">{{ study.report.protocol }}</p>
                </div>
                <div v-if="study.report.protocolEn" class="p-3 bg-muted/50 rounded-lg">
                  <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.english') }}</p>
                  <p class="text-sm whitespace-pre-wrap">{{ study.report.protocolEn }}</p>
                </div>
              </div>
            </div>
            <div v-else>
              <label class="section-header">{{ t('studyDetail.protocol') }}</label>
              <p class="text-sm text-muted-foreground italic">{{ t('studyDetail.noProtocol') }}</p>
            </div>

            <!-- Findings Section -->
            <div v-if="study.report?.findings || study.report?.findingsEn">
              <label class="section-header">{{ t('studyDetail.findings') }}</label>
              <div class="mt-2 grid gap-4" :class="study.report.findings && study.report.findingsEn ? 'grid-cols-2' : 'grid-cols-1'">
                <div v-if="study.report.findings" class="p-3 bg-muted/50 rounded-lg">
                  <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.russian') }}</p>
                  <p class="text-sm whitespace-pre-wrap">{{ study.report.findings }}</p>
                </div>
                <div v-if="study.report.findingsEn" class="p-3 bg-muted/50 rounded-lg">
                  <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.english') }}</p>
                  <p class="text-sm whitespace-pre-wrap">{{ study.report.findingsEn }}</p>
                </div>
              </div>
            </div>
            <div v-else>
              <label class="section-header">{{ t('studyDetail.findings') }}</label>
              <p class="text-sm text-muted-foreground italic">{{ t('studyDetail.noFindings') }}</p>
            </div>

            <!-- Impression Section -->
            <div v-if="study.report?.impression || study.report?.impressionEn">
              <label class="section-header">{{ t('studyDetail.impression') }}</label>
              <div class="mt-2 grid gap-4" :class="study.report.impression && study.report.impressionEn ? 'grid-cols-2' : 'grid-cols-1'">
                <div v-if="study.report.impression" class="p-3 bg-muted/50 rounded-lg">
                  <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.russian') }}</p>
                  <p class="text-sm whitespace-pre-wrap">{{ study.report.impression }}</p>
                </div>
                <div v-if="study.report.impressionEn" class="p-3 bg-muted/50 rounded-lg">
                  <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.english') }}</p>
                  <p class="text-sm whitespace-pre-wrap">{{ study.report.impressionEn }}</p>
                </div>
              </div>
            </div>
            <div v-else>
              <label class="section-header">{{ t('studyDetail.impression') }}</label>
              <p class="text-sm text-muted-foreground italic">{{ t('studyDetail.noImpression') }}</p>
            </div>
          </div>
        </div>

        <!-- Validator Comments -->
        <div v-if="study.validatorComments && study.validatorComments.length > 0" class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('studyDetail.validatorComments') }}</h3>
            <span class="text-xs text-muted-foreground">{{ t('studyDetail.commentCount', { count: study.validatorComments.length }) }}</span>
          </div>
          <div class="clinical-card-body space-y-3">
            <div v-for="comment in study.validatorComments" :key="comment.id" class="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg border-l-4 border-amber-500/30">
              <div class="flex items-start justify-between mb-2">
                <p class="text-sm font-medium">{{ comment.validatorName }}</p>
                <p class="text-xs text-muted-foreground">{{ format(new Date(comment.timestamp), "MMM dd, yyyy HH:mm") }}</p>
              </div>
              <p class="text-sm whitespace-pre-wrap">{{ comment.text }}</p>
            </div>
          </div>
        </div>

        <!-- Prior Studies -->
        <div v-if="study.hasPriors" class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('studyDetail.priorStudies') }}</h3>
            <span class="text-xs text-muted-foreground">{{ t('studyDetail.available', { count: study.priorCount }) }}</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('studyDetail.type') }}</th>
                <th>{{ t('studyDetail.date') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prior in study.priorStudies" :key="prior.id">
                <td class="text-sm font-medium">{{ prior.type }}</td>
                <td class="text-sm text-muted-foreground">{{ format(new Date(prior.date), "MMM dd, yyyy HH:mm") }}</td>
                <td class="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="selectedPrior = prior"
                    :disabled="!prior.protocol && !prior.protocolEn && !prior.findings && !prior.findingsEn && !prior.impression && !prior.impressionEn && !prior.reportText"
                  >
                    <FileText class="w-4 h-4 mr-2" />
                    {{ t('studyDetail.report') }}
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    <Download class="w-4 h-4 mr-2" />
                    {{ t('studyDetail.dicom') }}
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
              {{ t('studyDetail.linkedBodyParts') }}
            </h3>
            <span class="text-xs text-muted-foreground">{{ t('studyDetail.zones', { count: linkedStudies.length + 1 }) }}</span>
          </div>
          <div class="divide-y divide-border">
            <!-- Current study -->
            <div class="p-3 bg-primary/10">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ study.bodyArea }}</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ study.id }}</p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">{{ t('studyDetail.current') }}</span>
              </div>
            </div>
            <!-- Linked studies -->
            <button
              v-for="linked in linkedStudies"
              :key="linked.id"
              @click="router.push(`/task/${linked.id}`)"
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
              {{ t('studyDetail.history') }}
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
              {{ t('studyDetail.noHistory') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reassign Dialog -->
    <Dialog v-model:open="showReassignDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('studyDetail.reassignDialog.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('studyDetail.reassignDialog.description') }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="section-header">{{ t('studyDetail.reassignDialog.selectRadiologist') }}</label>
            <select
              v-model="selectedRadiologistId"
              class="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option :value="null">{{ t('studyDetail.reassignDialog.selectPlaceholder') }}</option>
              <optgroup v-if="availableRadiologists.reporting.length > 0" :label="t('studyDetail.reassignDialog.reportingRadiologists')">
                <option v-for="user in availableRadiologists.reporting" :key="user.id" :value="user.id">
                  {{ user.first_name }} {{ user.last_name }} ({{ user.active_task_count }} active tasks)
                </option>
              </optgroup>
              <optgroup v-if="availableRadiologists.validating.length > 0" :label="t('studyDetail.reassignDialog.validatingRadiologists')">
                <option v-for="user in availableRadiologists.validating" :key="user.id" :value="user.id">
                  {{ user.first_name }} {{ user.last_name }} ({{ user.active_task_count }} active tasks)
                </option>
              </optgroup>
            </select>
          </div>
          <div>
            <label class="section-header">{{ t('studyDetail.reassignDialog.comment') }}</label>
            <textarea
              v-model="reassignComment"
              class="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[80px]"
              :placeholder="t('studyDetail.reassignDialog.commentPlaceholder')"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <Button variant="outline" @click="showReassignDialog = false">{{ t('common.cancel') }}</Button>
          <Button @click="handleReassign" :disabled="!selectedRadiologistId || reassigning">
            {{ reassigning ? t('studyDetail.reassignDialog.reassigning') : t('studyDetail.reassignDialog.confirm') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Prior Report Dialog -->
    <Dialog :open="!!selectedPrior" @update:open="selectedPrior = null">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <FileText class="w-5 h-5" />
            {{ t('studyDetail.priorReportDialog.title') }} - {{ selectedPrior?.type }}
          </DialogTitle>
          <p class="text-sm text-muted-foreground">{{ selectedPrior?.date }}</p>
        </DialogHeader>
        <div class="space-y-4 mt-4">
          <!-- Protocol Section -->
          <div v-if="selectedPrior?.protocol || selectedPrior?.protocolEn">
            <label class="section-header">{{ t('studyDetail.protocol') }}</label>
            <div class="mt-2 grid gap-4" :class="selectedPrior.protocol && selectedPrior.protocolEn ? 'grid-cols-2' : 'grid-cols-1'">
              <div v-if="selectedPrior.protocol" class="p-4 bg-muted/50 rounded-lg">
                <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.russian') }}</p>
                <p class="text-sm whitespace-pre-wrap">{{ selectedPrior.protocol }}</p>
              </div>
              <div v-if="selectedPrior.protocolEn" class="p-4 bg-muted/50 rounded-lg">
                <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.english') }}</p>
                <p class="text-sm whitespace-pre-wrap">{{ selectedPrior.protocolEn }}</p>
              </div>
            </div>
          </div>

          <!-- Findings Section -->
          <div v-if="selectedPrior?.findings || selectedPrior?.findingsEn">
            <label class="section-header">{{ t('studyDetail.findings') }}</label>
            <div class="mt-2 grid gap-4" :class="selectedPrior.findings && selectedPrior.findingsEn ? 'grid-cols-2' : 'grid-cols-1'">
              <div v-if="selectedPrior.findings" class="p-4 bg-muted/50 rounded-lg">
                <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.russian') }}</p>
                <p class="text-sm whitespace-pre-wrap">{{ selectedPrior.findings }}</p>
              </div>
              <div v-if="selectedPrior.findingsEn" class="p-4 bg-muted/50 rounded-lg">
                <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.english') }}</p>
                <p class="text-sm whitespace-pre-wrap">{{ selectedPrior.findingsEn }}</p>
              </div>
            </div>
          </div>

          <!-- Impression Section -->
          <div v-if="selectedPrior?.impression || selectedPrior?.impressionEn">
            <label class="section-header">{{ t('studyDetail.impression') }}</label>
            <div class="mt-2 grid gap-4" :class="selectedPrior.impression && selectedPrior.impressionEn ? 'grid-cols-2' : 'grid-cols-1'">
              <div v-if="selectedPrior.impression" class="p-4 bg-muted/50 rounded-lg">
                <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.russian') }}</p>
                <p class="text-sm whitespace-pre-wrap">{{ selectedPrior.impression }}</p>
              </div>
              <div v-if="selectedPrior.impressionEn" class="p-4 bg-muted/50 rounded-lg">
                <p class="text-xs font-medium text-muted-foreground mb-2">{{ t('studyDetail.english') }}</p>
                <p class="text-sm whitespace-pre-wrap">{{ selectedPrior.impressionEn }}</p>
              </div>
            </div>
          </div>

          <!-- Fallback to reportText if no structured data -->
          <div v-if="!selectedPrior?.protocol && !selectedPrior?.protocolEn && !selectedPrior?.findings && !selectedPrior?.findingsEn && !selectedPrior?.impression && !selectedPrior?.impressionEn && selectedPrior?.reportText">
            <label class="section-header">{{ t('studyDetail.report') }}</label>
            <div class="mt-2 p-4 bg-muted/50 rounded-lg">
              <p class="text-sm whitespace-pre-wrap">{{ selectedPrior.reportText }}</p>
            </div>
          </div>

          <!-- No content available -->
          <div v-if="!selectedPrior?.protocol && !selectedPrior?.protocolEn && !selectedPrior?.findings && !selectedPrior?.findingsEn && !selectedPrior?.impression && !selectedPrior?.impressionEn && !selectedPrior?.reportText">
            <div class="mt-2 p-4 bg-muted/50 rounded-lg text-center">
              <p class="text-sm text-muted-foreground">{{ t('studyDetail.noProtocol') }}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Download, UserPlus, History, Link2, FileText } from 'lucide-vue-next'
import Button from '@/components/ui/button.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import { getLinkedStudies } from '@/utils/linkedStudies'
import { useStudyStore } from '@/stores/studyStore'
import { useAuditStore } from '@/stores/auditStore'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import type { PriorStudy } from '@/types/study'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const studyStore = useStudyStore()
const auditStore = useAuditStore()

const selectedPrior = ref<PriorStudy | null>(null)
const showReassignDialog = ref(false)
const selectedRadiologistId = ref<number | null>(null)
const reassignComment = ref('')
const reassigning = ref(false)
const reportingRadiologists = ref<any[]>([])
const validatingRadiologists = ref<any[]>([])

const study = computed(() =>
  studyStore.currentStudy || studyStore.studies.find(s => s.id === route.params.taskId as string)
)

const linkedStudies = computed(() =>
  study.value ? getLinkedStudies(study.value, studyStore.studies) : []
)

const studyAuditLog = computed(() =>
  study.value ? auditStore.auditLog.filter(l => l.studyId === study.value.id) : []
)

const availableRadiologists = computed(() => {
  const isValidationStatus = study.value?.status === 'assigned-for-validation' || study.value?.status === 'under-validation'

  return {
    reporting: isValidationStatus ? [] : reportingRadiologists.value,
    validating: validatingRadiologists.value
  }
})

async function fetchRadiologists() {
  try {
    const response = await fetch('http://localhost:8000/api/v1/admin/users/with-details?per_page=100', {
      headers: {
        'Authorization': 'Basic YWRtaW5AZXhhbXBsZS5jb206cGFzc3dvcmQxMjM='
      }
    })
    const data = await response.json()
    const users = data.items || []

    reportingRadiologists.value = users.filter((u: any) => u.role === 'reporting_radiologist')
    validatingRadiologists.value = users.filter((u: any) => u.role === 'validating_radiologist')
  } catch (error) {
    console.error('Failed to fetch radiologists:', error)
  }
}

async function handleReassign() {
  if (!study.value || !selectedRadiologistId.value) return

  reassigning.value = true
  try {
    const taskId = study.value.taskId
    const selectedUser = [...reportingRadiologists.value, ...validatingRadiologists.value]
      .find(u => u.id === selectedRadiologistId.value)

    let endpoint = ''

    // Determine which endpoint to use based on task status and selected radiologist role
    if (selectedUser?.role === 'validating_radiologist') {
      endpoint = `/api/v1/admin/tasks/${taskId}/assign-validation`
    } else if (study.value.status === 'new' || study.value.status === 'assigned') {
      endpoint = `/api/v1/admin/tasks/${taskId}/assign-reporting`
    } else {
      endpoint = `/api/v1/admin/tasks/${taskId}/reassign`
    }

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic YWRtaW5AZXhhbXBsZS5jb206cGFzc3dvcmQxMjM='
      },
      body: JSON.stringify({
        radiologist_id: selectedRadiologistId.value,
        comment: reassignComment.value || 'Reassigned by admin'
      })
    })

    if (!response.ok) {
      const error = await response.json()

      // Handle specific error cases
      if (error.detail?.includes('assigned_for_validation to assigned_for_validation')) {
        throw new Error('Cannot reassign validators once task is already assigned for validation. The task must be started by the current validator first.')
      }

      throw new Error(error.detail || 'Failed to reassign task')
    }

    // Refresh the study data
    await studyStore.fetchStudyById(study.value.id)
    await auditStore.fetchAuditLog()

    // Close dialog and reset
    showReassignDialog.value = false
    selectedRadiologistId.value = null
    reassignComment.value = ''
  } catch (error) {
    console.error('Failed to reassign task:', error)
    alert(error instanceof Error ? error.message : 'Failed to reassign task')
  } finally {
    reassigning.value = false
  }
}

onMounted(async () => {
  const taskId = route.params.taskId as string
  await Promise.all([
    studyStore.fetchStudyById(taskId),
    auditStore.fetchAuditLog(),
    fetchRadiologists()
  ])
})
</script>
