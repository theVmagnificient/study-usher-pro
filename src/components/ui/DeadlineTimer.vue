<template>
  <div :class="cn(
    'flex items-center gap-1.5 text-sm',
    isOverdue && 'deadline-critical',
    isCritical && 'deadline-critical',
    isWarning && 'deadline-warning',
    !isOverdue && !isCritical && !isWarning && 'deadline-normal',
    className
  )">
    <Clock class="w-3.5 h-3.5" />
    <span>{{ displayText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  deadline: string
  className?: string
}

const props = defineProps<Props>()

const now = computed(() => new Date())
const deadlineDate = computed(() => new Date(props.deadline))
const diffMs = computed(() => deadlineDate.value.getTime() - now.value.getTime())
const absDiffMs = computed(() => Math.abs(diffMs.value))
const diffHours = computed(() => Math.floor(absDiffMs.value / (1000 * 60 * 60)))
const diffMins = computed(() => Math.floor((absDiffMs.value % (1000 * 60 * 60)) / (1000 * 60)))

const isOverdue = computed(() => diffMs.value < 0)
const isCritical = computed(() => !isOverdue.value && diffHours.value < 1)
const isWarning = computed(() => !isOverdue.value && diffHours.value >= 1 && diffHours.value < 4)

const displayText = computed(() => {
  if (isOverdue.value) {
    return diffHours.value > 0 ? `-${diffHours.value}h ${diffMins.value}m` : `-${diffMins.value}m`
  } else if (diffHours.value < 1) {
    return `${diffMins.value}m`
  } else if (diffHours.value < 24) {
    return `${diffHours.value}h ${diffMins.value}m`
  } else {
    const days = Math.floor(diffHours.value / 24)
    const remainingHours = diffHours.value % 24
    return `${days}d ${remainingHours}h`
  }
})

// Update every minute
let interval: number | undefined
onMounted(() => {
  interval = window.setInterval(() => {
    // Force reactivity update
  }, 60000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

