<template>
  <MenubarRoot
    :class="cn('flex h-10 items-center space-x-1 rounded-md border bg-background p-1', className)"
    v-bind="$attrs"
  >
    <slot />
  </MenubarRoot>
</template>

<script setup lang="ts">
import { MenubarRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

