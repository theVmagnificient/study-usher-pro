<template>
  <SeparatorRoot
    :orientation="orientation"
    :decorative="decorative"
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { SeparatorRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
  className: ''
})
</script>

