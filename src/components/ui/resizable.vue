<template>
  <div
    :class="cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)"
    v-bind="$attrs"
  >
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

