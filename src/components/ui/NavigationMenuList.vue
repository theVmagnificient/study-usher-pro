<template>
  <NavigationMenuListRoot
    :class="cn('group flex flex-1 list-none items-center justify-center space-x-1', className)"
    v-bind="$attrs"
  >
    <slot />
  </NavigationMenuListRoot>
</template>

<script setup lang="ts">
import { NavigationMenuListRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

