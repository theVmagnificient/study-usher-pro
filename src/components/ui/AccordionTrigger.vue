<template>
  <AccordionHeader class="flex">
    <AccordionTriggerRoot
      :class="cn(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className
      )"
      v-bind="$attrs"
    >
      <slot />
      <ChevronDown class="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionTriggerRoot>
  </AccordionHeader>
</template>

<script setup lang="ts">
import { AccordionHeader, AccordionTriggerRoot } from 'radix-vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

