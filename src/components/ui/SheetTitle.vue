<template>
  <DialogTitle :class="cn('text-lg font-semibold text-foreground', className)" v-bind="$attrs">
    <slot />
  </DialogTitle>
</template>

<script setup lang="ts">
import { DialogTitle } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

