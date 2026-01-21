<template>
  <span :class="cn('status-badge', config.className, className)">
    <component :is="config.Icon" class="w-3 h-3 mr-1" />
    {{ config.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Zap, Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Urgency } from '@/types/study'

interface Props {
  urgency: Urgency
  className?: string
}

const props = defineProps<Props>()
const { t } = useI18n()

const urgencyMap: Record<Urgency, { key: string; className: string; Icon: any }> = {
  'stat': { key: 'urgency.stat', className: 'urgency-stat', Icon: Zap },
  'urgent': { key: 'urgency.urgent', className: 'urgency-urgent', Icon: AlertTriangle },
  'routine': { key: 'urgency.routine', className: 'urgency-routine', Icon: Clock },
}

const config = computed(() => {
  const mapping = urgencyMap[props.urgency]
  return {
    label: t(mapping.key),
    className: mapping.className,
    Icon: mapping.Icon
  }
})
</script>

