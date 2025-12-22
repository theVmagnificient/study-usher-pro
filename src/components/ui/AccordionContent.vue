<template>
  <AccordionContentRoot
    class="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    v-bind="$attrs"
  >
    <div :class="cn('pb-4 pt-0', className)">
      <slot />
    </div>
  </AccordionContentRoot>
</template>

<script setup lang="ts">
import { AccordionContentRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

