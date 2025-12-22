<template>
  <h2 :class="cn('text-lg font-semibold leading-none tracking-tight', className)">
    <slot />
  </h2>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

