<template>
  <caption :class="cn('mt-4 text-sm text-muted-foreground', className)" v-bind="$attrs">
    <slot />
  </caption>
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

