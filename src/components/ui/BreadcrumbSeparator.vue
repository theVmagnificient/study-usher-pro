<template>
  <li role="presentation" aria-hidden="true" :class="cn('[&>svg]:size-3.5', className)" v-bind="$attrs">
    <slot>
      <ChevronRight />
    </slot>
  </li>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

