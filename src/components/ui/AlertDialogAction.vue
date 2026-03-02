<template>
  <AlertDialogActionRoot :class="cn(buttonVariants(), className)" v-bind="$attrs">
    <slot />
  </AlertDialogActionRoot>
</template>

<script setup lang="ts">
import { AlertDialogActionRoot } from 'radix-vue'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button.vue'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

