<template>
  <span :class="cn('status-badge', config.className, className)">
    {{ config.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'
import type { StudyStatus } from '@/types/study'

interface Props {
  status: StudyStatus | string
  className?: string
}

const props = defineProps<Props>()
const { t } = useI18n()

// Map status values to i18n keys and CSS classes
const statusMap: Record<string, { key: string; className: string }> = {
  'new': { key: 'status.new', className: 'status-new' },
  'assigned': { key: 'status.assigned', className: 'status-assigned' },
  'in-progress': { key: 'status.inProgress', className: 'status-in-progress' },
  'in_progress': { key: 'status.inProgress', className: 'status-in-progress' },
  'draft-ready': { key: 'status.draftReady', className: 'status-draft-ready' },
  'draft_ready': { key: 'status.draftReady', className: 'status-draft-ready' },
  'under-validation': { key: 'status.underValidation', className: 'status-under-validation' },
  'under_validation': { key: 'status.underValidation', className: 'status-under-validation' },
  'returned': { key: 'status.returned', className: 'status-returned' },
  'returned_for_revision': { key: 'status.returned', className: 'status-returned' },
  'returned-for-revision': { key: 'status.returned', className: 'status-returned' },
  'assigned_for_validation': { key: 'status.assignedForValidation', className: 'status-under-validation' },
  'assigned-for-validation': { key: 'status.assignedForValidation', className: 'status-under-validation' },
  'translated': { key: 'status.translated', className: 'status-draft-ready' },
  'finalized': { key: 'status.finalized', className: 'status-finalized' },
  'delivered': { key: 'status.delivered', className: 'status-delivered' },
}

const config = computed(() => {
  const mapping = statusMap[props.status]
  if (mapping) {
    return {
      label: t(mapping.key),
      className: mapping.className
    }
  }
  return {
    label: props.status, // Fallback to raw status value
    className: 'status-assigned'
  }
})
</script>

