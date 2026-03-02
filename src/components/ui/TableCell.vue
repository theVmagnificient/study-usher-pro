<template>
  <td :class="cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)" v-bind="$attrs">
    <slot />
  </td>
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

