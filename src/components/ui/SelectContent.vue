<template>
  <SelectPortal>
    <SelectContent :class="cn('relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md', className)">
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>

<script setup lang="ts">
import { SelectContent, SelectViewport, SelectPortal } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

