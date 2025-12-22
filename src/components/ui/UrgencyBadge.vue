<template>
  <span :class="cn('status-badge', config.className, className)">
    <component :is="config.Icon" class="w-3 h-3 mr-1" />
    {{ config.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Zap, Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Urgency } from '@/types/study'

interface Props {
  urgency: Urgency
  className?: string
}

const props = defineProps<Props>()

const urgencyConfig: Record<Urgency, { label: string; className: string; Icon: any }> = {
  'stat': { label: 'STAT', className: 'urgency-stat', Icon: Zap },
  'urgent': { label: 'Urgent', className: 'urgency-urgent', Icon: AlertTriangle },
  'routine': { label: 'Routine', className: 'urgency-routine', Icon: Clock },
}

const config = computed(() => urgencyConfig[props.urgency])
</script>

