<template>
  <div v-if="linkedStudies.length > 0" :class="cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
    'bg-primary/10 text-primary border border-primary/20',
    className
  )">
    <Link2 class="w-3 h-3" />
    <span>{{ allBodyAreas.length }} zones</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Link2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Study } from '@/types/study'

interface Props {
  study: Study
  allStudies: Study[]
  className?: string
}

const props = defineProps<Props>()

const linkedStudies = computed(() => {
  if (!props.study.linkedStudyGroup) return []
  return props.allStudies.filter(
    s => s.linkedStudyGroup === props.study.linkedStudyGroup && s.id !== props.study.id
  )
})

const allBodyAreas = computed(() => {
  return [props.study.bodyArea, ...linkedStudies.value.map(s => s.bodyArea)]
})
</script>

