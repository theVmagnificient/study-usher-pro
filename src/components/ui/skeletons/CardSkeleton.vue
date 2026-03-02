<template>
  <div class="clinical-card">
    <div v-if="showHeader" class="clinical-card-header">
      <SkeletonLoader width="40%" height="1.25rem" />
      <SkeletonLoader v-if="showHeaderAction" width="20%" height="1rem" />
    </div>
    <div class="clinical-card-body space-y-3">
      <div v-for="i in rows" :key="i" class="flex items-center gap-4">
        <SkeletonLoader :width="`${60 + Math.random() * 30}%`" height="1rem" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonLoader from '../SkeletonLoader.vue'

interface Props {
  rows?: number
  showHeader?: boolean
  showHeaderAction?: boolean
}

withDefaults(defineProps<Props>(), {
  rows: 3,
  showHeader: true,
  showHeaderAction: false,
})
</script>
