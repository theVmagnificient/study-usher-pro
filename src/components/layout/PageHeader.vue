<template>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-xl font-semibold text-foreground">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-muted-foreground mt-0.5">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()
</script>

