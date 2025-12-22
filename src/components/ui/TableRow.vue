<template>
  <tr :class="cn('border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50', className)" v-bind="$attrs">
    <slot />
  </tr>
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

