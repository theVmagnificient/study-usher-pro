<template>
  <div class="clinical-card">
    <div class="clinical-card-body text-center py-6">
      <SkeletonLoader width="60%" height="0.875rem" class="mx-auto mb-2" />
      <SkeletonLoader width="40%" height="2rem" class="mx-auto mt-2" />
      <SkeletonLoader width="30%" height="0.75rem" class="mx-auto mt-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonLoader from '../SkeletonLoader.vue'
</script>
