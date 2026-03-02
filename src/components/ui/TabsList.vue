<template>
  <TabsListRoot
    :class="cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )"
  >
    <slot />
  </TabsListRoot>
</template>

<script setup lang="ts">
import { TabsList as TabsListRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

