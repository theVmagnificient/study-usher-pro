<template>
  <div :class="cn(
    'flex items-center gap-1.5 text-sm',
    className
  )">
    <Timer class="w-3.5 h-3.5" />
    <span>{{ displayText }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Timer } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  /** ISO 8601 start time (e.g. receivedAt / study_datetime) */
  startTime: string
  /** ISO 8601 end time. If omitted, counts up from startTime to now (live). */
  endTime?: string
  className?: string
}

const props = defineProps<Props>()

const tick = ref(0)

const elapsedMs = computed(() => {
  // Reference tick to force recomputation
  void tick.value
  const start = new Date(props.startTime).getTime()
  const end = props.endTime ? new Date(props.endTime).getTime() : Date.now()
  return Math.max(0, end - start)
})

const displayText = computed(() => {
  const totalMinutes = Math.floor(elapsedMs.value / (1000 * 60))
  const totalHours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (totalHours < 1) {
    return `${mins}m`
  } else if (totalHours < 24) {
    return `${totalHours}h ${mins}m`
  } else {
    const days = Math.floor(totalHours / 24)
    const remainingHours = totalHours % 24
    return `${days}d ${remainingHours}h`
  }
})

// Live update every minute for tasks that are still in progress
let interval: number | undefined
onMounted(() => {
  if (!props.endTime) {
    interval = window.setInterval(() => {
      tick.value++
    }, 60000)
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
