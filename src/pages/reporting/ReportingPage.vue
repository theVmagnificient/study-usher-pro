<template>
  <div class="min-h-screen bg-background">
    <!-- Header Bar -->
    <header class="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="handleBack">
            <ArrowLeft class="w-5 h-5" />
          </Button>
          <div>
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs text-muted-foreground">{{ study.id }}</span>
              <StatusBadge :status="study.status" />
              <UrgencyBadge :urgency="study.urgency" />
            </div>
            <div class="flex items-center gap-4 mt-1">
              <span class="text-xs text-muted-foreground">{{ study.patientId }}</span>
              <span class="text-base font-semibold text-foreground">{{ study.modality }} {{ study.bodyArea }}</span>
              <span class="text-base font-medium text-foreground">{{ study.sex }}/{{ study.age }}y</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <DeadlineTimer :deadline="study.deadline" />
          <DropdownMenu v-if="linkedStudies.length > 0">
            <template #trigger>
              <Button variant="outline" size="sm">
                <Download class="w-4 h-4 mr-2" />
                DICOM
                <ChevronDown class="w-3 h-3 ml-1" />
              </Button>
            </template>
            <DropdownMenuItem>
              <Download class="w-4 h-4 mr-2" />
              Download {{ study.bodyArea }} only
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download class="w-4 h-4 mr-2" />
              Download all ({{ linkedStudies.length + 1 }} body parts)
            </DropdownMenuItem>
          </DropdownMenu>
          <Button v-else variant="outline" size="sm">
            <Download class="w-4 h-4 mr-2" />
            DICOM
          </Button>
        </div>
      </div>
    </header>

    <!-- Comments - Collapsible Section at Top -->
    <div v-if="study.validatorComments && study.validatorComments.length > 0" class="mx-4 mt-4">
      <button
        @click="commentsExpanded = !commentsExpanded"
        class="w-full clinical-card border-l-4 border-l-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer text-left"
      >
        <div class="clinical-card-header">
          <h3 class="text-sm font-semibold flex items-center gap-2 text-foreground">
            <MessageCircle class="w-4 h-4 text-muted-foreground" />
            Comments
            <span class="ml-1 text-xs font-normal text-muted-foreground">
              ({{ study.validatorComments.length }} comment{{ study.validatorComments.length !== 1 ? 's' : '' }})
            </span>
          </h3>
          <ChevronUp v-if="commentsExpanded" class="w-4 h-4 text-muted-foreground" />
          <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
        </div>
        <div v-if="!commentsExpanded" class="clinical-card-body">
          <p class="text-sm text-foreground line-clamp-1">
            {{ sortedComments[0]?.text }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            — {{ sortedComments[0]?.validatorName }} • {{ formatTime(sortedComments[0]?.timestamp) }}
          </p>
        </div>
      </button>
      <div v-if="commentsExpanded" class="mt-2 space-y-2">
        <div
          v-for="comment in study.validatorComments"
          :key="comment.id"
          :class="cn(
            'clinical-card border-l-4',
            comment.isCritical
              ? 'border-l-destructive bg-destructive/5'
              : 'border-l-yellow-500 bg-yellow-500/5'
          )"
        >
          <div class="clinical-card-body">
            <p class="text-sm text-foreground">{{ comment.text }}</p>
            <p class="text-xs text-muted-foreground mt-2">
              — {{ comment.validatorName }} • {{ formatDate(comment.timestamp) }} at {{ formatTime(comment.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Clinical & Technical Notes -->
    <div class="mx-4 mt-4 grid grid-cols-2 gap-4">
      <button
        @click="notesExpanded = !notesExpanded"
        class="clinical-card border-l-4 border-l-primary text-left w-full hover:bg-primary/5 transition-colors cursor-pointer"
      >
        <div class="clinical-card-header">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" />
            Clinical Notes
          </h3>
          <ChevronUp v-if="notesExpanded" class="w-4 h-4 text-muted-foreground" />
          <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
        </div>
        <div class="clinical-card-body">
          <p :class="cn('text-sm text-foreground transition-all', !notesExpanded && 'line-clamp-2')">
            {{ clinicalNotesText }}
          </p>
        </div>
      </button>
      <button
        @click="notesExpanded = !notesExpanded"
        class="clinical-card border-l-4 border-l-muted-foreground text-left w-full hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div class="clinical-card-header">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <MessageSquare class="w-4 h-4 text-muted-foreground" />
            Technical Notes
          </h3>
          <ChevronUp v-if="notesExpanded" class="w-4 h-4 text-muted-foreground" />
          <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
        </div>
        <div class="clinical-card-body">
          <p :class="cn('text-sm text-foreground transition-all', !notesExpanded && 'line-clamp-2')">
            {{ technicalNotesText }}
          </p>
        </div>
      </button>
    </div>

    <div class="flex">
      <!-- Main Content - Report Editor -->
      <div class="flex-1 p-6">
        <div class="space-y-6">
          <!-- Headers Row -->
          <div class="grid grid-cols-2 gap-6">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-primary">Current Report</span>
              <span class="text-xs text-muted-foreground font-mono">{{ study.id }}</span>
            </div>
            <div v-if="selectedPrior || showEnglishTranslation" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Languages v-if="showEnglishTranslation" class="w-4 h-4 text-blue-500" />
                <History v-else class="w-4 h-4 text-muted-foreground" />
                <span v-if="showEnglishTranslation" class="text-sm font-semibold text-blue-600 dark:text-blue-400">English Translation</span>
                <span v-else class="text-sm font-semibold text-muted-foreground">Prior Report</span>
                <span v-if="showEnglishTranslation" class="text-xs text-muted-foreground">Auto-generated</span>
                <span v-else class="text-xs text-muted-foreground">{{ selectedPrior?.type }} • {{ selectedPrior?.date }}</span>
              </div>
              <Button variant="ghost" size="icon" @click="showEnglishTranslation ? showEnglishTranslation = false : selectedPrior = null">
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <!-- Study Protocol Row -->
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="field-label">Study Protocol</label>
              <Textarea
                v-model="protocol"
                class="report-textarea"
                placeholder="Describe the imaging technique and protocol used..."
                :readonly="isValidator || study.status === 'finalized' || study.status === 'delivered'"
              />
            </div>
            <div v-if="showEnglishTranslation">
              <label class="field-label text-blue-600 dark:text-blue-400">Study Protocol (EN)</label>
              <Textarea
                v-model="englishProtocol"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :readonly="study.status === 'finalized' || study.status === 'delivered'"
              />
            </div>
            <div v-else-if="selectedPrior">
              <label class="field-label text-muted-foreground">Study Protocol</label>
              <div class="report-textarea bg-muted/50">
                <p class="text-sm text-muted-foreground italic">Protocol not available for prior studies</p>
              </div>
            </div>
          </div>

          <!-- Findings Row -->
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="field-label">Findings</label>
              <Textarea
                v-model="findings"
                class="report-textarea"
                placeholder="Document all imaging findings in detail..."
                :readonly="isValidator || study.status === 'finalized' || study.status === 'delivered'"
              />
            </div>
            <div v-if="showEnglishTranslation">
              <label class="field-label text-blue-600 dark:text-blue-400">Findings (EN)</label>
              <Textarea
                v-model="englishFindings"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :readonly="study.status === 'finalized' || study.status === 'delivered'"
              />
            </div>
            <div v-else-if="selectedPrior">
              <label class="field-label text-muted-foreground">Findings</label>
              <div class="report-textarea bg-muted/50">
                <p class="text-sm">{{ selectedPrior.reportText }}</p>
              </div>
            </div>
          </div>

          <!-- Impression Row -->
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="field-label">Impression</label>
              <Textarea
                v-model="impression"
                class="report-textarea"
                placeholder="Provide a summary interpretation and recommendations..."
                :readonly="isValidator || study.status === 'finalized' || study.status === 'delivered'"
              />
            </div>
            <div v-if="showEnglishTranslation">
              <label class="field-label text-blue-600 dark:text-blue-400">Impression (EN)</label>
              <Textarea
                v-model="englishImpression"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :readonly="study.status === 'finalized' || study.status === 'delivered'"
              />
            </div>
            <div v-else-if="selectedPrior">
              <label class="field-label text-muted-foreground">Impression</label>
              <div class="report-textarea bg-muted/50">
                <p class="text-sm text-muted-foreground italic">See findings above</p>
              </div>
            </div>
          </div>

          <!-- Validator Comment Input Section -->
          <div v-if="isValidator" class="clinical-card border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/20">
            <div class="clinical-card-header">
              <h3 class="text-sm font-semibold flex items-center gap-2 text-foreground">
                <MessageCircle class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Add Validator Comment
              </h3>
              <span class="text-xs text-muted-foreground">Optional feedback for the reporting radiologist</span>
            </div>
            <div class="clinical-card-body">
              <Textarea
                v-model="validatorComment"
                class="report-textarea bg-background"
                placeholder="Leave a comment about the report quality, suggestions for improvement, or positive feedback..."
                :rows="3"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-6">
            <div class="flex items-center justify-between pt-4 border-t border-border">
              <div v-if="isValidator" class="flex items-center gap-3">
                <Button
                  variant="outline"
                  @click="handleReturn"
                  :disabled="!validatorComment.trim()"
                >
                  <RotateCcw class="w-4 h-4 mr-2" />
                  Return for Revision
                </Button>
                <Button @click="handleApprove">
                  <CheckCircle class="w-4 h-4 mr-2" />
                  Finalize Report
                </Button>
              </div>
              <div v-else class="flex items-center gap-3">
                <Button variant="outline" @click="handleSaveDraft">
                  <Save class="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button @click="showSubmitDialog = true">
                  <Send class="w-4 h-4 mr-2" />
                  Submit for Validation
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ study.status === 'finalized' || study.status === 'delivered' 
                  ? 'This report is finalized and cannot be edited'
                  : 'Changes are not auto-saved' }}
              </p>
            </div>
            <div v-if="selectedPrior || showEnglishTranslation" class="pt-4 border-t border-border">
              <Button v-if="selectedPrior" variant="outline" size="sm">
                <Download class="w-4 h-4 mr-2" />
                Download DICOM
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <aside class="w-72 border-l border-border bg-muted/30 p-4 space-y-4 flex-shrink-0">
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
            <div class="p-3 bg-primary/10">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ study.bodyArea }}</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ study.id }}</p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">Current</span>
              </div>
            </div>
            <button
              v-for="linked in linkedStudies"
              :key="linked.id"
              @click="router.push(`/report/${linked.id}`)"
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

        <!-- English Translation Toggle -->
        <div v-if="isValidator" class="clinical-card border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Languages class="w-4 h-4 text-blue-500" />
              Translation
            </h3>
          </div>
          <button
            @click="showEnglishTranslation = !showEnglishTranslation; if (!showEnglishTranslation) selectedPrior = null"
            :class="cn(
              'w-full p-3 text-left transition-colors flex items-center justify-between',
              showEnglishTranslation
                ? 'bg-blue-500/10 dark:bg-blue-500/20 border-l-2 border-l-blue-500'
                : 'hover:bg-muted/50'
            )"
          >
            <div>
              <p class="text-sm font-medium">English Version</p>
              <p class="text-xs text-muted-foreground">Auto-generated from Russian</p>
            </div>
            <span v-if="showEnglishTranslation" class="text-xs text-blue-600 dark:text-blue-400 font-medium">Viewing</span>
            <ChevronRight v-else class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <!-- Prior Studies -->
        <div v-if="study.hasPriors" class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">Prior Studies</h3>
            <span class="text-xs text-muted-foreground">{{ mockPriorStudies.length }}</span>
          </div>
          <div class="divide-y divide-border">
            <button
              v-for="prior in mockPriorStudies"
              :key="prior.id"
              @click="handlePriorClick(prior)"
              :class="cn(
                'w-full p-3 text-left transition-colors flex items-center justify-between',
                selectedPrior?.id === prior.id
                  ? 'bg-primary/10 border-l-2 border-l-primary'
                  : 'hover:bg-muted/50'
              )"
            >
              <div>
                <p class="text-sm font-medium">{{ prior.type }}</p>
                <p class="text-xs text-muted-foreground">{{ prior.date }}</p>
              </div>
              <span v-if="selectedPrior?.id === prior.id" class="text-xs text-primary font-medium">Viewing</span>
              <ChevronRight v-else class="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- Patient Summary Panel -->
    <div class="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-lg z-20">
      <button
        @click="summaryExpanded = !summaryExpanded"
        class="w-full p-3 flex items-center justify-between bg-primary/5 rounded-t-lg hover:bg-primary/10 transition-colors"
      >
        <div class="flex items-center gap-2">
          <User class="w-4 h-4 text-primary" />
          <span class="text-sm font-semibold">Patient Summary</span>
          <span class="text-xs text-muted-foreground">{{ study.patientId }}</span>
        </div>
        <ChevronDown v-if="summaryExpanded" class="w-4 h-4 text-muted-foreground" />
        <ChevronUp v-else class="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div v-if="summaryExpanded" class="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Demographics</h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">Sex:</span>
              <span class="ml-1 font-medium">{{ study.sex === 'M' ? 'Male' : 'Female' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Age:</span>
              <span class="ml-1 font-medium">{{ study.age }} years</span>
            </div>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Study</h4>
          <div class="text-sm space-y-1">
            <p><span class="text-muted-foreground">Type:</span> <span class="font-medium">{{ study.modality }} {{ study.bodyArea }}</span></p>
            <p><span class="text-muted-foreground">Client:</span> <span class="font-medium">{{ study.clientName }}</span></p>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Clinical History</h4>
          <p class="text-sm">Persistent cough for 3 weeks. History of smoking (20 pack-years). Rule out pulmonary pathology.</p>
        </div>
        <div v-if="study.hasPriors">
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Prior Imaging ({{ mockPriorStudies.length }})
          </h4>
          <div class="space-y-2">
            <div v-for="prior in mockPriorStudies" :key="prior.id" class="text-sm p-2 bg-muted/50 rounded">
              <div class="flex justify-between items-center mb-1">
                <span class="font-medium">{{ prior.type }}</span>
                <span class="text-xs text-muted-foreground">{{ prior.date }}</span>
              </div>
              <p class="text-xs text-muted-foreground line-clamp-2">{{ prior.reportText }}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Points</h4>
          <ul class="text-sm space-y-1">
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              <span>No acute cardiopulmonary findings on prior CT</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              <span>Clear lungs on prior chest X-ray</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-muted-foreground">•</span>
              <span>Normal abdominal organs on prior CT</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Submit Dialog -->
    <Dialog v-model:open="showSubmitDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit for Validation</DialogTitle>
          <DialogDescription>
            Are you sure you want to submit this report for validation? 
            You will not be able to edit the report after it has been finalized by the validator.
          </DialogDescription>
        </DialogHeader>
        <div class="p-4 bg-muted/50 rounded-md">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-urgency-urgent flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">
              Please verify you have addressed all relevant body areas and prior studies before submitting.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showSubmitDialog = false">Cancel</Button>
          <Button @click="handleSubmit">Confirm Submission</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  Save,
  Send,
  ChevronRight,
  FileText,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  RotateCcw,
  Link2,
  X,
  History,
  User,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Languages
} from 'lucide-vue-next'
import Button from '@/components/ui/button.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import { mockStudies, mockPriorStudies } from '@/data/mockData'
import { getLinkedStudies } from '@/utils/linkedStudies'
import { cn } from '@/lib/utils'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import DropdownMenu from '@/components/ui/dropdown-menu.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'
import DropdownMenuSeparator from '@/components/ui/DropdownMenuSeparator.vue'
import Textarea from '@/components/ui/textarea.vue'
import type { PriorStudy } from '@/types/study'

const route = useRoute()
const router = useRouter()

const study = computed(() => mockStudies.find(s => s.id === route.params.studyId) || mockStudies[0])
const linkedStudies = computed(() => getLinkedStudies(study.value, mockStudies))

const protocol = ref("Non-contrast CT of the chest was performed using standard departmental protocol.")
const findings = ref("")
const impression = ref("")
const showSubmitDialog = ref(false)
const selectedPrior = ref<PriorStudy | null>(null)
const showEnglishTranslation = ref(false)
const summaryExpanded = ref(true)
const notesExpanded = ref(false)
const validatorComment = ref("")
const commentsExpanded = ref(true)

const englishProtocol = ref("Non-contrast CT of the chest was performed using standard departmental protocol. Slice thickness 1.5mm with iterative reconstruction.")
const englishFindings = ref("The lungs are clear bilaterally without evidence of consolidation, masses, or nodules. No pleural effusion identified. The mediastinal structures are within normal limits. Heart size is normal. No lymphadenopathy. The visualized portions of the upper abdomen are unremarkable.")
const englishImpression = ref("Normal chest CT examination. No acute cardiopulmonary process identified. Follow-up imaging is not indicated based on current findings.")

const clinicalNotesText = `Patient presents with persistent cough for 3 weeks, productive of yellowish sputum. History of smoking (20 pack-years), quit 2 years ago. Reports occasional dyspnea on exertion and mild chest discomfort. No hemoptysis. No fever or night sweats reported. Family history significant for lung cancer (father, diagnosed age 62). Previous chest X-ray from 6 months ago showed no significant abnormalities. Patient currently on ACE inhibitor for hypertension - consider ACE inhibitor-induced cough in differential. Weight loss of 5kg over past 2 months noted. Rule out pulmonary pathology including malignancy given risk factors.`

const technicalNotesText = `Study performed on Siemens SOMATOM Definition Edge (128-slice). Acquisition parameters: Slice thickness 1.5mm, reconstruction interval 1.0mm. kVp: 120, mAs: 180 (with tube current modulation enabled). Non-contrast examination per protocol. Pitch factor: 1.2. Scan range from lung apices to adrenal glands. Iterative reconstruction (SAFIRE strength 3) applied. Motion artifact present at lung bases - limited evaluation of lower lobes, recommend clinical correlation if persistent symptoms. Streak artifact from patient arms noted but does not significantly impact diagnostic quality. Total DLP: 385 mGy·cm. Effective dose estimate: 5.4 mSv. Images reviewed on Syngo.via workstation.`

const isValidator = computed(() => ['draft-ready', 'under-validation'].includes(study.value.status))
const isReturned = computed(() => study.value.status === 'returned')

const sortedComments = computed(() => {
  if (!study.value.validatorComments) return []
  return [...study.value.validatorComments].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

const handleBack = () => router.go(-1)
const handleSaveDraft = () => {
  // Visual feedback only
}
const handleSubmit = () => {
  showSubmitDialog.value = false
  router.go(-1)
}
const handleApprove = () => {
  router.go(-1)
}
const handleReturn = () => {
  router.go(-1)
}
const handlePriorClick = (prior: PriorStudy) => {
  selectedPrior.value = selectedPrior.value?.id === prior.id ? null : prior
  if (selectedPrior.value?.id !== prior.id) showEnglishTranslation.value = false
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>
