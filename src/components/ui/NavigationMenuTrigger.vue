<template>
  <NavigationMenuTriggerRoot
    :class="cn(
      'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50',
      className
    )"
    v-bind="$attrs"
  >
    <slot />
    <ChevronDown
      :class="cn(
        'relative top-px ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180',
        className
      )"
    />
  </NavigationMenuTriggerRoot>
</template>

<script setup lang="ts">
import { NavigationMenuTriggerRoot } from 'radix-vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

