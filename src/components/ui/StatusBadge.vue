<template>
  <span :class="cn('status-badge', config.className, className)">
    {{ config.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { StudyStatus } from '@/types/study'

interface Props {
  status: StudyStatus
  className?: string
}

const props = defineProps<Props>()

const statusConfig: Record<StudyStatus, { label: string; className: string }> = {
  'new': { label: 'New', className: 'status-new' },
  'assigned': { label: 'Assigned', className: 'status-assigned' },
  'in-progress': { label: 'In Progress', className: 'status-in-progress' },
  'draft-ready': { label: 'Draft Ready', className: 'status-draft-ready' },
  'under-validation': { label: 'Under Validation', className: 'status-under-validation' },
  'returned': { label: 'Returned', className: 'status-returned' },
  'finalized': { label: 'Finalized', className: 'status-finalized' },
  'delivered': { label: 'Delivered', className: 'status-delivered' },
}

const config = computed(() => statusConfig[props.status])
</script>

