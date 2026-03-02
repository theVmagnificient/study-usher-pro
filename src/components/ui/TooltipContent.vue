<template>
  <TooltipContent
    :side-offset="sideOffset"
    :class="cn(
      'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
      className
    )"
  >
    <slot />
  </TooltipContent>
</template>

<script setup lang="ts">
import { TooltipContent } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  sideOffset?: number
}

withDefaults(defineProps<Props>(), {
  sideOffset: 4
})
</script>


