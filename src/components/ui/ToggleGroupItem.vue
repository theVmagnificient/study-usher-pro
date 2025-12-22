<template>
  <ToggleGroupItemRoot
    :class="cn(
      toggleVariants({
        variant: variant || 'default',
        size: size || 'default',
      }),
      className
    )"
    v-bind="$attrs"
  >
    <slot />
  </ToggleGroupItemRoot>
</template>

<script setup lang="ts">
import { ToggleGroupItemRoot } from 'radix-vue'
import { cn } from '@/lib/utils'
import { toggleVariants } from './toggle.vue'

interface Props {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  className: ''
})
</script>

