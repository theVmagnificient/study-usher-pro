<template>
  <span :class="cn('ml-auto text-xs tracking-widest text-muted-foreground', className)" v-bind="$attrs">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

