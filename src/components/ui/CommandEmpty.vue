<template>
  <div :class="cn('py-6 text-center text-sm', className)" v-bind="$attrs">
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

