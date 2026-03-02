<template>
  <ToastDescription :class="cn('text-sm opacity-90', className)">
    <slot />
  </ToastDescription>
</template>

<script setup lang="ts">
import { ToastDescription } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

