<template>
  <tbody :class="cn('[&_tr:last-child]:border-0', className)" v-bind="$attrs">
    <slot />
  </tbody>
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

