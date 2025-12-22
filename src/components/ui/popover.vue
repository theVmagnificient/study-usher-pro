<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :align="align"
        :side-offset="sideOffset"
        :class="cn(
          'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
          className
        )"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverPortal } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  className?: string
}

withDefaults(defineProps<Props>(), {
  align: 'center',
  sideOffset: 4
})
</script>

