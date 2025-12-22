<template>
  <ToastTitle :class="cn('text-sm font-semibold', className)">
    <slot />
  </ToastTitle>
</template>

<script setup lang="ts">
import { ToastTitle } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

