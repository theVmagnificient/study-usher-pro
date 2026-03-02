<template>
  <div :class="cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)">
    <slot />
  </div>
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

