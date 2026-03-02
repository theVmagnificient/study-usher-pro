<template>
  <NavigationMenuRoot
    :class="cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)"
    v-bind="$attrs"
  >
    <slot />
    <NavigationMenuViewport />
  </NavigationMenuRoot>
</template>

<script setup lang="ts">
import { NavigationMenuRoot, NavigationMenuViewport } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

