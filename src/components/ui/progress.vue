<template>
  <ProgressRoot
    :class="cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)"
    v-bind="$attrs"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="{ transform: `translateX(-${100 - (value || 0)}%)` }"
    />
  </ProgressRoot>
</template>

<script setup lang="ts">
import { ProgressRoot, ProgressIndicator } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  value?: number
  className?: string
}

withDefaults(defineProps<Props>(), {
  value: 0,
  className: ''
})
</script>

