<template>
  <a
    v-if="!asChild"
    :class="cn('transition-colors hover:text-foreground', className)"
    v-bind="$attrs"
  >
    <slot />
  </a>
  <slot v-else />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  asChild?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  asChild: false,
  className: ''
})
</script>

