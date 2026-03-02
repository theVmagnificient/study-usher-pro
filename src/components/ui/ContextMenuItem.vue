<template>
  <ContextMenuItemRoot
    :class="cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )"
    v-bind="$attrs"
  >
    <slot />
  </ContextMenuItemRoot>
</template>

<script setup lang="ts">
import { ContextMenuItemRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  inset?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  inset: false,
  className: ''
})
</script>

