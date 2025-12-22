<template>
  <ToastRoot
    :class="cn(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
      variant === 'default' && 'border bg-background text-foreground',
      variant === 'destructive' && 'destructive group border-destructive bg-destructive text-destructive-foreground',
      className
    )"
  >
    <slot />
  </ToastRoot>
</template>

<script setup lang="ts">
import { ToastRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'destructive'
  className?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'default'
})
</script>
