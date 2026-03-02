<template>
  <ScrollAreaRoot :class="cn('relative overflow-hidden', className)" v-bind="$attrs">
    <ScrollAreaViewport class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>

<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaViewport, ScrollAreaCorner } from 'radix-vue'
import { cn } from '@/lib/utils'
import ScrollBar from './ScrollBar.vue'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

