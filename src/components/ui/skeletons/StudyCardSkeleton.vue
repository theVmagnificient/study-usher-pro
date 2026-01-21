<template>
  <div class="clinical-card">
    <div class="clinical-card-body">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 space-y-2">
          <SkeletonLoader width="30%" height="1.25rem" />
          <SkeletonLoader width="50%" height="0.875rem" />
        </div>
        <div class="flex items-center gap-2">
          <SkeletonLoader width="4rem" height="1.5rem" class="rounded-full" />
          <SkeletonLoader width="4rem" height="1.5rem" class="rounded-full" />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4 mt-4">
        <div class="space-y-1">
          <SkeletonLoader width="40%" height="0.75rem" />
          <SkeletonLoader width="60%" height="0.875rem" />
        </div>
        <div class="space-y-1">
          <SkeletonLoader width="50%" height="0.75rem" />
          <SkeletonLoader width="70%" height="0.875rem" />
        </div>
        <div class="space-y-1">
          <SkeletonLoader width="45%" height="0.75rem" />
          <SkeletonLoader width="55%" height="0.875rem" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonLoader from '../SkeletonLoader.vue'
</script>
