<template>
  <thead :class="cn('[&_tr]:border-b', className)" v-bind="$attrs">
    <slot />
  </thead>
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

