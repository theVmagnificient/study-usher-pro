<template>
  <AccordionItemRoot :class="cn('border-b', className)" v-bind="$attrs">
    <slot />
  </AccordionItemRoot>
</template>

<script setup lang="ts">
import { AccordionItemRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

