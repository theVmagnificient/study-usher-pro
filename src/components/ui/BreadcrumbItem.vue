<template>
  <li :class="cn('inline-flex items-center gap-1.5', className)" v-bind="$attrs">
    <slot />
  </li>
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

