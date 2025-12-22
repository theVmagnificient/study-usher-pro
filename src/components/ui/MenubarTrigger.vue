<template>
  <MenubarTriggerRoot
    :class="cn(
      'flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
      className
    )"
    v-bind="$attrs"
  >
    <slot />
  </MenubarTriggerRoot>
</template>

<script setup lang="ts">
import { MenubarTriggerRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

