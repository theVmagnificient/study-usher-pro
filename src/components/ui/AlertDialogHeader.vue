<template>
  <div :class="cn('flex flex-col space-y-2 text-center sm:text-left', className)" v-bind="$attrs">
    <slot />
  </div>
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

