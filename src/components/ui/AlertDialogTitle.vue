<template>
  <AlertDialogTitleRoot :class="cn('text-lg font-semibold', className)" v-bind="$attrs">
    <slot />
  </AlertDialogTitleRoot>
</template>

<script setup lang="ts">
import { AlertDialogTitleRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

