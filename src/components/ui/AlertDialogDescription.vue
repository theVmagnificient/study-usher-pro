<template>
  <AlertDialogDescriptionRoot :class="cn('text-sm text-muted-foreground', className)" v-bind="$attrs">
    <slot />
  </AlertDialogDescriptionRoot>
</template>

<script setup lang="ts">
import { AlertDialogDescriptionRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

