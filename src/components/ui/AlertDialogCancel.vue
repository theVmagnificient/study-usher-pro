<template>
  <AlertDialogCancelRoot
    :class="cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)"
    v-bind="$attrs"
  >
    <slot />
  </AlertDialogCancelRoot>
</template>

<script setup lang="ts">
import { AlertDialogCancelRoot } from 'radix-vue'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button.vue'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

