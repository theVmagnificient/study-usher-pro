<template>
  <div>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">{{ study.modality }}</span>
      <span class="text-sm font-semibold text-foreground">{{ study.bodyArea }}</span>
    </div>
    <div v-if="isMultiZone" class="text-xs text-primary font-medium flex items-center gap-1">
      <Link2 class="w-3 h-3" />
      <span>+ {{ otherBodyAreas.join(', ') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Link2 } from 'lucide-vue-next'
import type { Study } from '@/types/study'

interface Props {
  study: Study
  allStudies: Study[]
  showBadge?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBadge: true
})

const linkedStudies = computed(() => {
  return props.study.linkedStudyGroup 
    ? props.allStudies.filter(s => s.linkedStudyGroup === props.study.linkedStudyGroup && s.id !== props.study.id)
    : []
})

const isMultiZone = computed(() => linkedStudies.value.length > 0)
const otherBodyAreas = computed(() => linkedStudies.value.map(s => s.bodyArea))
</script>

