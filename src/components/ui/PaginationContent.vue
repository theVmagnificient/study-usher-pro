<template>
  <ul :class="cn('flex flex-row items-center gap-1', className)" v-bind="$attrs">
    <slot />
  </ul>
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

