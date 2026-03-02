<template>
  <div :class="cn('-mx-1 h-px bg-border', className)" v-bind="$attrs" />
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

