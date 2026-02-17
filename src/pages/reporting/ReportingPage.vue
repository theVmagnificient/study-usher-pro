<template>
  <div class="min-h-screen bg-background">
    <!-- Loading State -->
    <div v-if="taskStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="taskStore.error" class="p-4 bg-red-50 text-red-600 rounded-md m-6">
      {{ taskStore.error }}
    </div>

    <!-- Content -->
    <div v-else-if="study">
    <!-- Header Bar: compact in PiP -->
    <header class="sticky top-0 z-10 bg-card border-b border-border" :class="pipMode ? 'px-3 py-2' : 'px-4 py-3'">
      <div class="flex items-center justify-between gap-2 min-w-0">
        <div class="flex items-center gap-2 min-w-0">
          <Button v-if="!pipMode" variant="ghost" size="icon" class="flex-shrink-0" @click="handleBack">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs text-muted-foreground truncate">{{ study.accessionNumber }}</span>
              <StatusBadge :status="study.status" />
              <UrgencyBadge v-if="!pipMode" :urgency="study.urgency" />
            </div>
            <div class="flex items-center gap-2 mt-0.5 text-sm truncate">
              <span class="text-muted-foreground shrink-0">{{ study.patientId }}</span>
              <span class="font-semibold text-foreground truncate">{{ study.modality }} {{ study.bodyArea }}</span>
              <span class="text-muted-foreground shrink-0">{{ study.sex }}/{{ study.age }}y</span>
            </div>
          </div>
        </div>
        <div v-if="!pipMode" class="flex items-center gap-2 flex-shrink-0">
          <DeadlineTimer v-if="!['finalized', 'delivered'].includes(study.status)" :deadline="study.deadline" />
          <DropdownMenu v-if="linkedStudies.length > 0">
            <template #trigger>
              <Button variant="outline" size="sm">
                <Download class="w-4 h-4 mr-2" />
                {{ t('reporting.dicom') }}
                <ChevronDown class="w-3 h-3 ml-1" />
              </Button>
            </template>
            <DropdownMenuItem>
              <Download class="w-4 h-4 mr-2" />
              {{ t('reporting.downloadBodyArea', { area: study.bodyArea }) }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download class="w-4 h-4 mr-2" />
              {{ t('reporting.downloadAll', { count: linkedStudies.length + 1 }) }}
            </DropdownMenuItem>
          </DropdownMenu>
          <Button
            v-else
            variant="outline"
            size="sm"
            @click="handleDownload"
            :disabled="isDownloading"
          >
            <Download class="w-4 h-4 mr-2" :class="{ 'animate-bounce': isDownloading }" />
            {{ isDownloading ? t('reporting.downloading') : t('reporting.dicom') }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="handleOpenViewer"
            :disabled="isOpeningViewer"
          >
            <Eye class="w-4 h-4 mr-2" :class="{ 'animate-pulse': isOpeningViewer }" />
            {{ isOpeningViewer ? t('reporting.openingViewer') : t('reporting.viewer') }}
          </Button>
          <Button
            v-if="pipSupported"
            variant="outline"
            size="sm"
            @click="togglePictureInPicture"
            :disabled="isOpeningPip"
          >
            <PictureInPicture2 class="w-4 h-4 mr-2" :class="{ 'animate-pulse': isOpeningPip }" />
            {{ isPipOpen ? t('reporting.closePip') : t('reporting.openPip') }}
          </Button>
        </div>
        <Button
          v-else
          variant="outline"
          size="sm"
          class="flex-shrink-0"
          @click="closePip"
        >
          <PictureInPicture2 class="w-4 h-4 mr-1" />
          {{ t('reporting.closePip') }}
        </Button>
      </div>
    </header>

    <!-- Comments - Collapsible Section at Top (hidden in PiP to save space) -->
    <div v-if="!pipMode && study.validatorComments && study.validatorComments.length > 0" class="mx-4 mt-4">
      <button
        @click="commentsExpanded = !commentsExpanded"
        class="w-full clinical-card border-l-4 border-l-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer text-left"
      >
        <div class="clinical-card-header">
          <h3 class="text-sm font-semibold flex items-center gap-2 text-foreground">
            <MessageCircle class="w-4 h-4 text-muted-foreground" />
            {{ t('reporting.comments') }}
            <span class="ml-1 text-xs font-normal text-muted-foreground">
              ({{ t('reporting.commentCount', { count: study.validatorComments.length }) }})
            </span>
          </h3>
          <ChevronUp v-if="commentsExpanded" class="w-4 h-4 text-muted-foreground" />
          <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
        </div>
        <div v-if="!commentsExpanded" class="clinical-card-body">
          <div class="flex items-start gap-2">
            <FileEdit v-if="sortedComments[0]?.isAction" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <MessageCircle v-else class="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-foreground line-clamp-1 flex-1">
              {{ sortedComments[0]?.text }}
            </p>
          </div>
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
              : comment.isAction
              ? 'border-l-blue-500 bg-blue-500/5'
              : 'border-l-orange-500 bg-orange-500/5'
          )"
        >
          <div class="clinical-card-body">
            <div class="flex items-start gap-2">
              <FileEdit v-if="comment.isAction" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <MessageCircle v-else class="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p class="text-sm text-foreground whitespace-pre-line flex-1">{{ comment.text }}</p>
            </div>
            <p class="text-xs text-muted-foreground mt-2">
              — {{ comment.validatorName }} • {{ formatDate(comment.timestamp) }} at {{ formatTime(comment.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Clinical & Technical Notes (single column in PiP) -->
    <div class="mx-4 mt-4 grid gap-4" :class="pipMode ? 'grid-cols-1' : 'grid-cols-2'">
      <button
        @click="notesExpanded = !notesExpanded"
        class="clinical-card border-l-4 border-l-primary text-left w-full hover:bg-primary/5 transition-colors cursor-pointer"
      >
        <div class="clinical-card-header">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" />
            {{ t('reporting.clinicalNotes') }}
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
        v-if="isValidator"
        @click="notesExpanded = !notesExpanded"
        class="clinical-card border-l-4 border-l-muted-foreground text-left w-full hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div class="clinical-card-header">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <MessageSquare class="w-4 h-4 text-muted-foreground" />
            {{ t('reporting.technicalNotes') }}
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
      <!-- Main Content - Report Editor (single column in PiP) -->
      <div class="flex-1 min-w-0 p-4" :class="{ 'p-6': !pipMode }">
        <div class="space-y-4" :class="{ 'space-y-6': !pipMode }">
          <!-- Headers Row -->
          <div class="grid gap-4" :class="pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6'">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-primary">{{ t('reporting.currentReport') }}</span>
              <span class="text-xs text-muted-foreground font-mono">{{ study.id }}</span>
            </div>
            <div v-if="!pipMode && (selectedPrior || showEnglishTranslation)" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Languages v-if="showEnglishTranslation" class="w-4 h-4 text-blue-500" />
                <History v-else class="w-4 h-4 text-muted-foreground" />
                <span v-if="showEnglishTranslation" class="text-sm font-semibold text-blue-600 dark:text-blue-400">{{ t('reporting.englishTranslation') }}</span>
                <span v-else class="text-sm font-semibold text-muted-foreground">{{ t('reporting.priorReport') }}</span>
                <span v-if="showEnglishTranslation" class="text-xs text-muted-foreground">{{ t('reporting.manualTranslation') }}</span>
                <span v-else class="text-xs text-muted-foreground">{{ selectedPrior?.type }} • {{ selectedPrior?.date }}</span>
              </div>
              <Button variant="ghost" size="icon" @click="showEnglishTranslation ? showEnglishTranslation = false : selectedPrior = null">
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <!-- Study Protocol Row (single column in PiP) -->
          <div class="grid gap-4" :class="pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6'">
            <div>
              <label class="field-label">{{ t('reporting.protocol') }}</label>
              <Textarea
                v-model="protocol"
                class="report-textarea"
                :placeholder="t('reporting.protocolPlaceholder')"
                :readonly="study.status === 'finalized' || study.status === 'delivered' || (isTaskWithValidator && !isValidator)"
              />
            </div>
            <div v-if="!pipMode && showEnglishTranslation">
              <label class="field-label text-blue-600 dark:text-blue-400">
                {{ t('reporting.protocolEn') }}
                <span class="ml-2 text-xs font-normal text-muted-foreground">{{ t('reporting.protocolEnNote') }}</span>
              </label>
              <Textarea
                v-model="englishProtocol"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :placeholder="t('reporting.protocolEnPlaceholder')"
                :readonly="study.status === 'finalized' || study.status === 'delivered' || (isTaskWithValidator && !isValidator)"
              />
            </div>
            <div v-else-if="!pipMode && selectedPrior">
              <label class="field-label text-muted-foreground">{{ t('reporting.protocol') }}</label>
              <div class="report-textarea bg-muted/50 space-y-2">
                <p v-if="selectedPrior.protocolEn" class="text-base font-medium">{{ selectedPrior.protocolEn }}</p>
                <p v-if="selectedPrior.protocol" class="text-xs text-muted-foreground">{{ selectedPrior.protocol }}</p>
                <p v-if="!selectedPrior.protocolEn && !selectedPrior.protocol" class="text-sm text-muted-foreground italic">{{ t('reporting.protocolNotAvailable') }}</p>
              </div>
            </div>
          </div>

          <!-- Findings Row (single column in PiP) -->
          <div class="grid gap-4" :class="pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6'">
            <div class="relative">
              <label class="field-label">{{ t('reporting.findings') }}</label>
              <Textarea
                ref="findingsTextareaRef"
                v-model="findings"
                class="report-textarea"
                :placeholder="t('reporting.findingsPlaceholder')"
                :readonly="study.status === 'finalized' || study.status === 'delivered' || (isTaskWithValidator && !isValidator)"
                @keydown="findingsSlash.onKeydown"
                @input="findingsSlash.onInput"
              />
              <TemplatePopup
                :show="findingsSlash.showPopup.value"
                :templates="findingsSlash.filteredTemplates.value"
                :active-index="findingsSlash.activeIndex.value"
                :empty-text="t('reporting.templatePopup.noResults')"
                @select="findingsSlash.selectTemplate"
              />
            </div>
            <div v-if="!pipMode && showEnglishTranslation">
              <label class="field-label text-blue-600 dark:text-blue-400">
                {{ t('reporting.findingsEn') }}
                <span class="ml-2 text-xs font-normal text-muted-foreground">{{ t('reporting.protocolEnNote') }}</span>
              </label>
              <Textarea
                v-model="englishFindings"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :placeholder="t('reporting.findingsEnPlaceholder')"
                :readonly="study.status === 'finalized' || study.status === 'delivered' || (isTaskWithValidator && !isValidator)"
              />
            </div>
            <div v-else-if="!pipMode && selectedPrior">
              <label class="field-label text-muted-foreground">{{ t('reporting.findings') }}</label>
              <div class="report-textarea bg-muted/50 space-y-2">
                <p v-if="selectedPrior.findingsEn" class="text-base font-medium">{{ selectedPrior.findingsEn }}</p>
                <p v-if="selectedPrior.findings" class="text-xs text-muted-foreground">{{ selectedPrior.findings }}</p>
                <p v-else-if="selectedPrior.reportText && !selectedPrior.findings" class="text-xs text-muted-foreground">{{ selectedPrior.reportText }}</p>
                <p v-if="!selectedPrior.findingsEn && !selectedPrior.findings && !selectedPrior.reportText" class="text-sm text-muted-foreground italic">{{ t('reporting.findingsNotAvailable') }}</p>
              </div>
            </div>
          </div>

          <!-- Impression Row (single column in PiP) -->
          <div class="grid gap-4" :class="pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6'">
            <div class="relative">
              <label class="field-label">{{ t('reporting.impression') }}</label>
              <Textarea
                ref="impressionTextareaRef"
                v-model="impression"
                class="report-textarea"
                :placeholder="t('reporting.impressionPlaceholder')"
                :readonly="study.status === 'finalized' || study.status === 'delivered' || (isTaskWithValidator && !isValidator)"
                @keydown="impressionSlash.onKeydown"
                @input="impressionSlash.onInput"
              />
              <TemplatePopup
                :show="impressionSlash.showPopup.value"
                :templates="impressionSlash.filteredTemplates.value"
                :active-index="impressionSlash.activeIndex.value"
                :empty-text="t('reporting.templatePopup.noResults')"
                @select="impressionSlash.selectTemplate"
              />
            </div>
            <div v-if="!pipMode && showEnglishTranslation">
              <label class="field-label text-blue-600 dark:text-blue-400">
                {{ t('reporting.impressionEn') }}
                <span class="ml-2 text-xs font-normal text-muted-foreground">{{ t('reporting.protocolEnNote') }}</span>
              </label>
              <Textarea
                v-model="englishImpression"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :placeholder="t('reporting.impressionEnPlaceholder')"
                :readonly="study.status === 'finalized' || study.status === 'delivered' || (isTaskWithValidator && !isValidator)"
              />
            </div>
            <div v-else-if="!pipMode && selectedPrior">
              <label class="field-label text-muted-foreground">{{ t('reporting.impression') }}</label>
              <div class="report-textarea bg-muted/50 space-y-2">
                <p v-if="selectedPrior.impressionEn" class="text-base font-medium">{{ selectedPrior.impressionEn }}</p>
                <p v-if="selectedPrior.impression" class="text-xs text-muted-foreground">{{ selectedPrior.impression }}</p>
                <p v-if="!selectedPrior.impressionEn && !selectedPrior.impression" class="text-sm text-muted-foreground italic">{{ t('reporting.impressionNotAvailable') }}</p>
              </div>
            </div>
          </div>

          <!-- Validator Comment Input Section (hidden in PiP) -->
          <div v-if="!pipMode && isValidator" class="clinical-card border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/20">
            <div class="clinical-card-header">
              <h3 class="text-sm font-semibold flex items-center gap-2 text-foreground">
                <MessageCircle class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {{ t('reporting.addValidatorComment') }}
              </h3>
              <span class="text-xs text-muted-foreground">{{ t('reporting.validatorCommentNote') }}</span>
            </div>
            <div class="clinical-card-body">
              <Textarea
                v-model="validatorComment"
                class="report-textarea bg-background"
                :placeholder="t('reporting.validatorCommentPlaceholder')"
                :rows="3"
              />
            </div>
          </div>
          
          <div class="grid gap-4 pt-4 border-t border-border" :class="pipMode ? 'grid-cols-1' : 'grid-cols-2 gap-6'">
            <div class="flex items-center justify-between">
              <div v-if="isValidator" class="flex items-center gap-3">
                <Button
                  variant="outline"
                  @click="handleReturn"
                  :disabled="!validatorComment.trim()"
                >
                  <RotateCcw class="w-4 h-4 mr-2" />
                  {{ t('reporting.returnForRevision') }}
                </Button>
                <Button
                  variant="outline"
                  @click="handleSaveValidatorChanges"
                  :disabled="isSavingValidatorChanges"
                >
                  <div v-if="isSavingValidatorChanges" class="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  <Save v-else class="w-4 h-4 mr-2" />
                  {{ isSavingValidatorChanges ? t('reporting.saving') : t('reporting.saveChanges') }}
                </Button>
                <Button @click="handleApprove">
                  <CheckCircle class="w-4 h-4 mr-2" />
                  {{ t('reporting.finalizeReport') }}
                </Button>
              </div>
              <div v-else class="flex items-center gap-3">
                <Button
                  variant="outline"
                  @click="handleSaveDraft"
                  :disabled="isTaskWithValidator"
                >
                  <Save class="w-4 h-4 mr-2" />
                  {{ t('reporting.saveDraft') }}
                </Button>
                <Button
                  v-if="!isTaskCompleted"
                  @click="handleOpenSubmitDialog"
                  :disabled="isTaskWithValidator"
                >
                  <Send class="w-4 h-4 mr-2" />
                  {{ t('reporting.submitForValidation') }}
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ study.status === 'finalized' || study.status === 'delivered'
                  ? t('reporting.finalizedNote')
                  : t('reporting.notAutoSaved') }}
              </p>
            </div>
            <div v-if="!pipMode && (selectedPrior || showEnglishTranslation)" class="pt-4 border-t border-border">
              <Button v-if="selectedPrior" variant="outline" size="sm">
                <Download class="w-4 h-4 mr-2" />
                {{ t('common.download') }} {{ t('reporting.dicom') }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar (hidden in PiP) -->
      <aside v-if="!pipMode" class="w-72 border-l border-border bg-muted/30 p-4 space-y-4 flex-shrink-0">
        <!-- Linked Body Parts -->
        <div v-if="linkedStudies.length > 0" class="clinical-card border-primary/30 bg-primary/5">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Link2 class="w-4 h-4 text-primary" />
              {{ t('reporting.linkedBodyParts') }}
            </h3>
            <span class="text-xs text-muted-foreground">{{ t('reporting.zones', { count: linkedStudies.length + 1 }) }}</span>
          </div>
          <div class="divide-y divide-border">
            <div class="p-3 bg-primary/10">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ study.bodyArea }}</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ study.id }}</p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">{{ t('reporting.current') }}</span>
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
              {{ t('reporting.translation') }}
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
              <p class="text-sm font-medium">{{ t('reporting.englishVersion') }}</p>
              <p class="text-xs text-muted-foreground">{{ t('reporting.manualTranslationRequired') }}</p>
            </div>
            <span v-if="showEnglishTranslation" class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{ t('reporting.viewing') }}</span>
            <ChevronRight v-else class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <!-- Prior Studies -->
        <div v-if="study.hasPriors" class="clinical-card">
          <div class="clinical-card-header">
            <h3 class="text-sm font-semibold">{{ t('reporting.priorStudies') }}</h3>
            <span class="text-xs text-muted-foreground">{{ priorStudies.length }}</span>
          </div>
          <div class="divide-y divide-border">
            <button
              v-for="prior in priorStudies"
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
              <span v-if="selectedPrior?.id === prior.id" class="text-xs text-primary font-medium">{{ t('reporting.viewing') }}</span>
              <ChevronRight v-else class="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- Patient Summary Panel -->
    <div v-if="false" class="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-lg z-20">
      <button
        @click="summaryExpanded = !summaryExpanded"
        class="w-full p-3 flex items-center justify-between bg-primary/5 rounded-t-lg hover:bg-primary/10 transition-colors"
      >
        <div class="flex items-center gap-2">
          <User class="w-4 h-4 text-primary" />
          <span class="text-sm font-semibold">{{ t('reporting.patientSummary') }}</span>
          <span class="text-xs text-muted-foreground">{{ study.patientId }}</span>
        </div>
        <ChevronDown v-if="summaryExpanded" class="w-4 h-4 text-muted-foreground" />
        <ChevronUp v-else class="w-4 h-4 text-muted-foreground" />
      </button>

      <div v-if="summaryExpanded" class="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{{ t('reporting.demographics') }}</h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">{{ t('reporting.sex') }}</span>
              <span class="ml-1 font-medium">{{ study.sex === 'M' ? t('reporting.male') : t('reporting.female') }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">{{ t('reporting.age') }}</span>
              <span class="ml-1 font-medium">{{ study.age }} {{ t('reporting.years') }}</span>
            </div>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{{ t('reporting.currentStudy') }}</h4>
          <div class="text-sm space-y-1">
            <p><span class="text-muted-foreground">{{ t('reporting.type') }}</span> <span class="font-medium">{{ study.modality }} {{ study.bodyArea }}</span></p>
            <p><span class="text-muted-foreground">{{ t('reporting.client') }}</span> <span class="font-medium">{{ study.clientName }}</span></p>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{{ t('reporting.clinicalHistory') }}</h4>
          <p class="text-sm">Persistent cough for 3 weeks. History of smoking (20 pack-years). Rule out pulmonary pathology.</p>
        </div>
        <div v-if="study.hasPriors && priorStudies.length > 0">
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {{ t('reporting.priorImaging', { count: priorStudies.length }) }}
          </h4>
          <div class="space-y-2">
            <div v-for="prior in priorStudies" :key="prior.id" class="text-sm p-2 bg-muted/50 rounded">
              <div class="flex justify-between items-center mb-1">
                <span class="font-medium">{{ prior.type }}</span>
                <span class="text-xs text-muted-foreground">{{ prior.date }}</span>
              </div>
              <p class="text-xs text-muted-foreground line-clamp-2">{{ prior.reportText || prior.findings || 'No report text available' }}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{{ t('reporting.keyPoints') }}</h4>
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
          <DialogTitle>{{ t('reporting.submitDialog.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('reporting.submitDialog.description') }}
          </DialogDescription>
        </DialogHeader>

        <div class="p-4 bg-muted/50 rounded-md">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-urgency-urgent flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">
              {{ t('reporting.submitDialog.warning') }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showSubmitDialog = false">{{ t('common.cancel') }}</Button>
          <Button @click="handleSubmit">{{ t('reporting.submitDialog.confirmSubmission') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Report Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Report</DialogTitle>
          <DialogDescription>
            Make corrections to the report. Only the fields you modify will be updated. A new version will be created.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <label class="field-label">{{ t('reporting.protocol') }}</label>
            <Textarea
              v-model="editProtocol"
              class="report-textarea"
              :placeholder="protocol"
              :rows="4"
            />
          </div>

          <div>
            <label class="field-label">{{ t('reporting.findings') }}</label>
            <Textarea
              v-model="editFindings"
              class="report-textarea"
              :placeholder="findings"
              :rows="6"
            />
          </div>

          <div>
            <label class="field-label">{{ t('reporting.impression') }}</label>
            <Textarea
              v-model="editImpression"
              class="report-textarea"
              :placeholder="impression"
              :rows="4"
            />
          </div>

          <div v-if="englishProtocol || englishFindings || englishImpression" class="space-y-4 pt-4 border-t border-border">
            <div>
              <label class="field-label text-blue-600 dark:text-blue-400">{{ t('reporting.protocolEn') }}</label>
              <Textarea
                v-model="editProtocolEn"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :placeholder="englishProtocol"
                :rows="4"
              />
            </div>

            <div>
              <label class="field-label text-blue-600 dark:text-blue-400">{{ t('reporting.findingsEn') }}</label>
              <Textarea
                v-model="editFindingsEn"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :placeholder="englishFindings"
                :rows="6"
              />
            </div>

            <div>
              <label class="field-label text-blue-600 dark:text-blue-400">{{ t('reporting.impressionEn') }}</label>
              <Textarea
                v-model="editImpressionEn"
                class="report-textarea bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                :placeholder="englishImpression"
                :rows="4"
              />
            </div>
          </div>

          <div>
            <label class="field-label">Comment (optional)</label>
            <Textarea
              v-model="editComment"
              class="report-textarea"
              placeholder="Add a comment about your changes..."
              :rows="2"
            />
          </div>

          <div class="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-md border border-amber-500/20">
            <p class="text-sm text-foreground">
              <strong>Note:</strong> Only fields you modify will be updated. Empty fields will keep their current values. This will create version {{ (study?.report?.version || 0) + 1 }} of the report.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showEditDialog = false">Cancel</Button>
          <Button @click="handleSaveEdit" :disabled="!hasEditChanges">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
  Languages,
  FileEdit,
  Eye,
  PictureInPicture2
} from 'lucide-vue-next'
import Button from '@/components/ui/button.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import UrgencyBadge from '@/components/ui/UrgencyBadge.vue'
import DeadlineTimer from '@/components/ui/DeadlineTimer.vue'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
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
import { useToast } from '@/hooks/use-toast'
import { studyService } from '@/services/studyService'
import { usePictureInPicture } from '@/composables/usePictureInPicture'
import { useSlashTemplates } from '@/composables/useSlashTemplates'
import { findingsTemplates, impressionTemplates } from '@/data/reportTemplates'
import TemplatePopup from '@/components/ui/TemplatePopup.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const taskStore = useTaskStore()
const { toast } = useToast()
const { pipSupported, isPipOpen, isOpeningPip, togglePictureInPicture, closePip, pipMode } = usePictureInPicture({
  canOpen: () => !!study.value,
  getWindowTitle: () => study.value?.accessionNumber ?? String(study.value?.id ?? 'Report'),
  loadShell: () => import('@/pages/reporting/PipShell.vue').then(m => m.default),
})

const study = computed(() => {
  // Always prefer currentTask for the current route since it has full data
  const numericTaskId = parseInt(route.params.taskId as string, 10)

  // Compare using taskId (not id, which is the formatted study ID)
  if (taskStore.currentTask?.taskId === numericTaskId) {
    console.log('study computed: using currentTask', {
      routeTaskId: numericTaskId,
      currentTaskId: taskStore.currentTask?.taskId,
      hasReport: !!taskStore.currentTask?.report
    })
    return taskStore.currentTask
  }

  // Otherwise, return null to show loading state until currentTask is fetched
  // We don't want to use the lightweight list data because it lacks report details
  console.log('study computed: waiting for currentTask to load', {
    routeTaskId: numericTaskId,
    currentTaskId: taskStore.currentTask?.taskId
  })
  return null
})
const linkedStudies = computed(() =>
  study.value ? getLinkedStudies(study.value, taskStore.myReportingTasks) : []
)

// Get prior studies from the study data
const priorStudies = computed(() => study.value?.priorStudies || [])

// Initialize report fields from study data
const protocol = computed({
  get: () => {
    const value = study.value?.report?.protocol || ''
    console.log('protocol computed get:', {hasStudy: !!study.value, hasReport: !!study.value?.report, protocol: value})
    return value
  },
  set: (value) => {
    if (taskStore.currentTask) {
      if (!taskStore.currentTask.report) {
        taskStore.currentTask.report = {}
      }
      taskStore.currentTask.report.protocol = value
    }
  }
})

const findings = computed({
  get: () => study.value?.report?.findings || '',
  set: (value) => {
    if (taskStore.currentTask) {
      if (!taskStore.currentTask.report) {
        taskStore.currentTask.report = {}
      }
      taskStore.currentTask.report.findings = value
    }
  }
})

const impression = computed({
  get: () => study.value?.report?.impression || '',
  set: (value) => {
    if (taskStore.currentTask) {
      if (!taskStore.currentTask.report) {
        taskStore.currentTask.report = {}
      }
      taskStore.currentTask.report.impression = value
    }
  }
})

// Slash-template refs and composables
const findingsTextareaRef = ref<ComponentPublicInstance | null>(null)
const findingsTextareaEl = computed(() => findingsTextareaRef.value?.$el as HTMLTextAreaElement | null)
const impressionTextareaRef = ref<ComponentPublicInstance | null>(null)
const impressionTextareaEl = computed(() => impressionTextareaRef.value?.$el as HTMLTextAreaElement | null)

const findingsSlash = useSlashTemplates({
  templates: findingsTemplates,
  modelValue: computed(() => findings.value) as any,
  textareaEl: findingsTextareaEl,
  onUpdate: (v: string) => { findings.value = v },
})

const impressionSlash = useSlashTemplates({
  templates: impressionTemplates,
  modelValue: computed(() => impression.value) as any,
  textareaEl: impressionTextareaEl,
  onUpdate: (v: string) => { impression.value = v },
})

const showSubmitDialog = ref(false)
const selectedPrior = ref<PriorStudy | null>(null)
const showEnglishTranslation = ref(false)
const summaryExpanded = ref(true)
const notesExpanded = ref(false)
const validatorComment = ref("")
const isSavingValidatorChanges = ref(false)
const commentsExpanded = ref(true)
const availableValidators = ref<any[]>([])
const selectedValidatorId = ref<number | null>(null)

const showEditDialog = ref(false)
const editProtocol = ref("")
const editFindings = ref("")
const editImpression = ref("")
const editProtocolEn = ref("")
const editFindingsEn = ref("")
const editImpressionEn = ref("")
const editComment = ref("")

const englishProtocol = computed({
  get: () => study.value?.report?.protocolEn || '',
  set: (value) => {
    if (taskStore.currentTask) {
      if (!taskStore.currentTask.report) {
        taskStore.currentTask.report = {}
      }
      taskStore.currentTask.report.protocolEn = value
    }
  }
})

const englishFindings = computed({
  get: () => study.value?.report?.findingsEn || '',
  set: (value) => {
    if (taskStore.currentTask) {
      if (!taskStore.currentTask.report) {
        taskStore.currentTask.report = {}
      }
      taskStore.currentTask.report.findingsEn = value
    }
  }
})

const englishImpression = computed({
  get: () => study.value?.report?.impressionEn || '',
  set: (value) => {
    if (taskStore.currentTask) {
      if (!taskStore.currentTask.report) {
        taskStore.currentTask.report = {}
      }
      taskStore.currentTask.report.impressionEn = value
    }
  }
})

const clinicalNotesText = computed(() => study.value?.clinicalNotes || t('reporting.noClinicalNotes'))

const technicalNotesText = computed(() => study.value?.technicalNotes || t('reporting.noTechnicalNotes'))

const authStore = useAuthStore()
const isValidator = computed(() => authStore.role === 'validating-radiologist')

const isTaskCompleted = computed(() => {
  if (!study.value) return false

  const completedStatuses = ['finalized', 'delivered']
  return completedStatuses.includes(study.value.status)
})

const isTaskWithValidator = computed(() => {
  if (!study.value) return false

  const validatorStatuses = ['assigned-for-validation', 'under-validation']
  return validatorStatuses.includes(study.value.status)
})

const sortedComments = computed(() => {
  if (!study.value.validatorComments) return []
  return [...study.value.validatorComments].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

const hasEditChanges = computed(() => {
  return editProtocol.value.trim() !== '' ||
         editFindings.value.trim() !== '' ||
         editImpression.value.trim() !== '' ||
         editProtocolEn.value.trim() !== '' ||
         editFindingsEn.value.trim() !== '' ||
         editImpressionEn.value.trim() !== ''
})

const handleBack = () => router.go(-1)

const handleOpenEditDialog = () => {
  // Reset edit fields
  editProtocol.value = ""
  editFindings.value = ""
  editImpression.value = ""
  editProtocolEn.value = ""
  editFindingsEn.value = ""
  editImpressionEn.value = ""
  editComment.value = ""
  showEditDialog.value = true
}

const handleSaveEdit = async () => {
  if (!study.value || !hasEditChanges.value) return

  try {
    const updates: any = {}

    // Only include fields that were modified
    if (editProtocol.value.trim()) updates.protocol = editProtocol.value
    if (editFindings.value.trim()) updates.findings = editFindings.value
    if (editImpression.value.trim()) updates.impression = editImpression.value
    if (editProtocolEn.value.trim()) updates.protocol_en = editProtocolEn.value
    if (editFindingsEn.value.trim()) updates.findings_en = editFindingsEn.value
    if (editImpressionEn.value.trim()) updates.impression_en = editImpressionEn.value
    // Note: comment is NOT sent here - only on finalize/reject

    await taskStore.editReportByValidator(study.value.taskId, updates)

    // Reload task data to show new version
    await taskStore.fetchTaskDetails(study.value.taskId)

    showEditDialog.value = false
  } catch (error) {
    console.error('Failed to edit report:', error)
  }
}

const handleOpenSubmitDialog = async () => {
  showSubmitDialog.value = true
}

const handleSaveDraft = async () => {
  if (!study.value) return

  try {
    // 1. FIRST: Collect form data BEFORE any workflow transitions
    // This prevents data loss when fetchTaskDetails reloads from DB
    const reportData = {
      protocol: protocol.value,
      findings: findings.value,
      impression: impression.value,
      protocol_en: englishProtocol.value,
      findings_en: englishFindings.value,
      impression_en: englishImpression.value,
    }

    // 2. THEN: Handle workflow transitions if needed
    if (study.value.status === 'new') {
      await taskStore.takeTask(study.value.taskId)
      await taskStore.startTask(study.value.taskId)
    } else if (study.value.status === 'assigned') {
      await taskStore.startTask(study.value.taskId)
    } else if (study.value.status === 'returned') {
      await taskStore.startTask(study.value.taskId)
    }

    // 3. Save the report with data collected in step 1
    await taskStore.submitReport(study.value.taskId, reportData)

    // 4. Reload to get updated task status
    await taskStore.fetchTaskDetails(study.value.taskId)

    // 5. Show success feedback
    toast({
      title: t('reporting.draftSaved'),
      description: t('reporting.draftSavedDescription'),
      variant: 'default'
    })
  } catch (error) {
    console.error('Failed to save draft:', error)
    toast({
      title: t('reporting.saveError'),
      description: t('reporting.saveErrorDescription'),
      variant: 'destructive'
    })
  }
}

const handleSubmit = async () => {
  if (!study.value) return

  try {
    // If task is draft-ready or translated, submit for validation
    // Backend will auto-assign validator from schedule
    if (study.value.status === 'draft-ready' || study.value.status === 'translated') {
      await taskStore.assignForValidation(study.value.taskId)
      showSubmitDialog.value = false
      router.go(-1)
      return
    }

    // Handle workflow transitions before submitting
    if (study.value.status === 'new') {
      await taskStore.takeTask(study.value.taskId)
      await taskStore.fetchTaskDetails(study.value.taskId)  // Reload to get updated status
      await taskStore.startTask(study.value.taskId)
      await taskStore.fetchTaskDetails(study.value.taskId)  // Reload again
    } else if (study.value.status === 'assigned') {
      await taskStore.startTask(study.value.taskId)
      await taskStore.fetchTaskDetails(study.value.taskId)
    } else if (study.value.status === 'returned') {
      await taskStore.startTask(study.value.taskId)
      await taskStore.fetchTaskDetails(study.value.taskId)
    }

    const reportData = {
      protocol: protocol.value,
      findings: findings.value,
      impression: impression.value,
      protocol_en: englishProtocol.value,
      findings_en: englishFindings.value,
      impression_en: englishImpression.value,
    }

    await taskStore.submitReport(study.value.taskId, reportData)
    showSubmitDialog.value = false
    router.go(-1)
  } catch (error) {
    console.error('Failed to submit report:', error)
  }
}

const handleApprove = async () => {
  if (!study.value) return

  try {
    // Use taskId directly instead of parsing study ID
    // Pass validator comment if provided (optional non-critical comment)
    const comment = validatorComment.value.trim() || undefined
    await taskStore.finalizeTask(study.value.taskId, comment)
    router.go(-1)
  } catch (error) {
    console.error('Failed to finalize task:', error)
  }
}

const handleReturn = async () => {
  if (!study.value || !validatorComment.value.trim()) return

  try {
    // Use taskId directly instead of parsing study ID
    await taskStore.returnForRevision(study.value.taskId, validatorComment.value)
    router.go(-1)
  } catch (error) {
    console.error('Failed to return task for revision:', error)
  }
}

const handleSaveValidatorChanges = async () => {
  if (!study.value) return

  isSavingValidatorChanges.value = true

  try {
    const updates = {
      protocol: protocol.value,
      findings: findings.value,
      impression: impression.value,
      protocol_en: englishProtocol.value,
      findings_en: englishFindings.value,
      impression_en: englishImpression.value,
      // Note: comment is NOT sent here - only on finalize/reject
    }

    await taskStore.editReportByValidator(study.value.taskId, updates)

    // Reload task to get updated report (using taskId for optimized endpoint)
    await taskStore.fetchTaskDetails(study.value.taskId)

    // Note: validator comment is NOT cleared here - it will be sent only on finalize/reject

    // Show success toast
    toast({
      title: t('reporting.changesSaved'),
      description: t('reporting.changesSavedDescription'),
      variant: 'default'
    })
  } catch (error) {
    console.error('Failed to save validator changes:', error)
    toast({
      title: t('reporting.saveError'),
      description: t('reporting.saveErrorDescription'),
      variant: 'destructive'
    })
  } finally {
    isSavingValidatorChanges.value = false
  }
}

const handlePriorClick = (prior: PriorStudy) => {
  selectedPrior.value = selectedPrior.value?.id === prior.id ? null : prior
  if (selectedPrior.value?.id !== prior.id) showEnglishTranslation.value = false
}

// Download study from PACS
const isDownloading = ref(false)

const handleDownload = async () => {
  if (!study.value || isDownloading.value) return

  isDownloading.value = true

  try {
    await studyService.downloadStudy(study.value.studyId)
    toast({
      title: t('reporting.downloadStarted'),
      description: t('reporting.downloadDescription'),
    })
  } catch (error: any) {
    console.error('Failed to download study:', error)
    toast({
      title: t('reporting.downloadFailed'),
      description: error.message || t('reporting.downloadErrorDescription'),
      variant: 'destructive',
    })
  } finally {
    isDownloading.value = false
  }
}

// Open study in OHIF viewer
const isOpeningViewer = ref(false)

const handleOpenViewer = async () => {
  if (!study.value || isOpeningViewer.value) return

  isOpeningViewer.value = true

  try {
    await studyService.openViewer(study.value.studyId)
  } catch (error: any) {
    console.error('Failed to open viewer:', error)
    toast({
      title: t('reporting.viewerFailed'),
      description: error.message || t('reporting.viewerErrorDescription'),
      variant: 'destructive',
    })
  } finally {
    isOpeningViewer.value = false
  }
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  if (pipMode) return
  const taskId = parseInt(route.params.taskId as string, 10)
  await taskStore.fetchTaskDetails(taskId)

  // Auto-show translation for validators
  if (isValidator.value) {
    showEnglishTranslation.value = true
  }

  // Auto-start validation if validator opens an assigned_for_validation task
  if (isValidator.value && study.value?.status === 'assigned-for-validation') {
    try {
      await taskStore.startValidationTask(taskId)
      await taskStore.fetchTaskDetails(taskId)
    } catch (error) {
      console.error('Failed to auto-start validation:', error)
    }
  }
})

// Watch for route changes to refetch task data when navigating between tasks
watch(() => route.params.taskId, async (newTaskId) => {
  if (pipMode || !newTaskId) return
  const taskId = parseInt(newTaskId as string, 10)
  await taskStore.fetchTaskDetails(taskId)

  // Auto-show translation for validators
  if (isValidator.value) {
    showEnglishTranslation.value = true
  }

  // Auto-start validation if validator opens an assigned_for_validation task
  if (isValidator.value && study.value?.status === 'assigned-for-validation') {
    try {
      await taskStore.startValidationTask(taskId)
      await taskStore.fetchTaskDetails(taskId)
    } catch (error) {
      console.error('Failed to auto-start validation:', error)
    }
  }
})
</script>

