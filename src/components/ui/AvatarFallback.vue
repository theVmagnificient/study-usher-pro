<template>
  <AvatarFallbackRoot
    :class="cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)"
    v-bind="$attrs"
  >
    <slot />
  </AvatarFallbackRoot>
</template>

<script setup lang="ts">
import { AvatarFallbackRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

