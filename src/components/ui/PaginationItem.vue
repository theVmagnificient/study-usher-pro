<template>
  <li :class="cn('', className)" v-bind="$attrs">
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

