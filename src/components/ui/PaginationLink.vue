<template>
  <a
    :aria-current="isActive ? 'page' : undefined"
    :class="cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      className
    )"
    v-bind="$attrs"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { buttonVariants } from './button.vue'

interface Props {
  isActive?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

withDefaults(defineProps<Props>(), {
  isActive: false,
  size: 'icon',
  className: ''
})
</script>

