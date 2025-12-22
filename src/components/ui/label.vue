<template>
  <LabelRoot
    :class="cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )"
    v-bind="$attrs"
  >
    <slot />
  </LabelRoot>
</template>

<script setup lang="ts">
import { Label as LabelRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

